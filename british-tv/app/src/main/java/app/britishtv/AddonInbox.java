package app.britishtv;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;

/**
 * Lets a phone or computer on the same Wi-Fi hand the TV an addon link, because those links are far too long to
 * type with a remote. Only runs while the "Add from your phone" screen is open. The page asks for the 4-digit code
 * shown on the TV (so nothing else on the network can push a link in), takes one link, and the app collects it.
 */
final class AddonInbox {

    private static final int PORT = 8767;
    private ServerSocket server;
    private volatile String code = "";
    private volatile String pending = "";
    private volatile int wrong = 0;

    private static final String PAGE = "<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<title>Telly Addicts</title><style>body{font:18px system-ui;margin:0;padding:22px;background:#0b1a4a;color:#fff}"
            + "h1{font-size:24px;margin:0 0 6px}p{color:#b9d1ff}input,textarea,button{width:100%;box-sizing:border-box;font:inherit;padding:14px;margin:8px 0;border-radius:10px;border:0}"
            + "textarea{height:130px}button{background:#ffb400;font-weight:700}#m{margin-top:12px;font-weight:700}</style></head><body>"
            + "<img alt='Telly Addicts' style='display:block;width:200px;max-width:60%;margin:0 0 16px' src='data:image/png;base64,"
            + "iVBORw0KGgoAAAANSUhEUgAAAWgAAACeCAMAAAAoh2BXAAAAwFBMVEUh5+VNjvRpbfgOEjytUNIEBVkwrev81SIdITtK8+7TR7H7"
            + "+/sVGjwVGj1FSF8Uoaz63UUcVGwZK00kZpMXH0JdUzWEai7dsyTPvE8WIEGrkS2klUKZ5PTCS8FLUa72PIuTRLCxPJSVl6dcKFVB"
            + "PDhKOZWkMXIAAP9VVVU7OImEe0W5u8XQNnwAVVVIqLn/////AP8AAAAUGTspLVouM1v+1y6PV+0YHUD+xh3+5EwbIkUA2NkK5+IN"
            + "Djj9ux1vZ/yBbYZDAAAAQHRSTlP+/v8X/wb+/+P+//9dqf3+//zq/mv+////n/////////////7///8BA/////8D/gEBAP3+/P//"
            + "/v///v7//f//CKaFmgAAG4VJREFUeNrtnQlj2zaygGmhlOmEskxKsiJn6+72SNru9UTJpkOJyf//V29mABA3CR3Pu8/RbNJVRBAU"
            + "PwwGg8GVrC/yKpJcEFxAX0Bf5L8RdIp/0wvoC+Y3ATpds3ySZZOcrdML6KMIIjc2zDmv6rqCvxm7aPSRwpiwDL2cEXNTtVVdfec6"
            + "nRxvEKpswoaSAeBymiTTpgKd/nwBfbA2Z9wgVHmfmqbrSV0VSbLfJwmQztfsAvpAfc4Ac1XC37qfNKQbJyC7ZNo2k+/adhwFGhS1"
            + "/vTTT59+AdR9pBkYjt0eNXo/rerJpTE8VKFBn//x7ieQX/rwYVNYNRfQx4JmqNC/EOeffgKVDhrezyyDy1OwGxfTcZxGA+hPnDOo"
            + "dBA0FUhlNIYX0CeArlM/PzIcC9DponPvLqbjaNPxjwpNbxrwoavs+gF0+tJhOboxBHifgPQ7tBwBk5CiC7i8vn7IStkFTy8afaig"
            + "8f3l0z8+bUBpM6+VBvvStPfXL9eIGlJdgkrHgP7MOywo7cPSZzwwmFQtgDKiXvR4JhfQA3Z6QpjL7OH6+r5t3M41GuglB73wXb+A"
            + "jhXQ2GoBmJ+ur13jQY7JA2rzCzSH9WR9ifwfC5oJ2/AC/3OMB1xs2gUZ6OtldjEcJ2k0OnmtUFoyHqnt2XFZ9EdDLqAjUEMfRNAk"
            + "rU01z66qhIG+/9573qeDxp5fu+CgDeNBnp3Q9SV2CC+cT9NovcVbKOORcgOtqfpFTh0FTztT/AJEU82zkwbaNN4X0EcbD+FcaJ4H"
            + "db2lZ3dWA33WAkvTodxDCdIjf/ZJGu0aD9H1vubwq7MaaBYnKZb2YJI1MxP5Xs+fIE2dvII3wUPOM4FGMxNkjlnX9XZ8kZMxT6pI"
            + "mQynzFieWV+Yv/Tz2koATqroqXXhB/k41vcjs/wcoFXDJ3qAzO56n4vzZzapY0HXwylr+mN8wRzn1bqFV1jm5tXNo0hT349k59Bo"
            + "x3jQP6/P3vX2veB5xQz2itEhI8GEW8Y6eCsNdbhXJzzQc+rcO9141Nmk+r/pejN8h+xDhNx9hJe7vetPRFbho0p0t3Wi6tDv1XK5"
            + "u21pbJlAm7lvlUKhMmzNJ23PBZoZxqOyut7sfKDpBb8MC4DO2o+9Ke/uCPRdl+juS2aDhs6tngsHnYoCv9OyhysVH6Tj2v5Bf/Td"
            + "n0rf/aDTf/7+73X8KMCDdJtF1/uad73j5N+//57GmKj29ssw6bsvf7YAuj/lR9IInVZlt9uonHouncrDhfZPnfQHcS+F4KEWaKWD"
            + "D6onadhG/3648XhBWWY4qIICyp0dlMnvg3PQqgE9lQIaVt0NKD0kqX6xyDOnSdBLIhOxMVLbzNDajFsHivAYV+iuLl8X9D/xvear"
            + "VVluowST3QqRH+T3EXeXq9WcDaLmGhYjC/t1XcuBZQH1Q33xsTXH6IWFsNVW/hK9xtxBydaZMCqgC3dmmSuLlHg6MvMSgRXF9hWk"
            + "KLBcynlvn4uqZRWl0KhFt0NKj2Nwf3awiJXhIfE2T7cBbQca5xPefjHtA15DVbg1yhNuki2hCxqeNgfK201TvZpsNvjEVQ/p1Naw"
            + "sIn+QMp6N1QWpgVe6ETcJgFLosm0n1J90G6+o5aUt4S6pn+ojNClrdF5WdxuX5EylwZQl3m/u74AJVFi6I72NTkd2vu6IkB3UO4E"
            + "KmY3CRrohabyzCxKbjvIcPypfysMdAj0ZPsfwCxQb3v8FIigmN7d3ZeOm9XQZaisnvLoknwQTkeX5kPI6dCKpisJ2RxqZYt2JTOy"
            + "vLsTBpr5o3cMOfP33ryi8JLdAOlgbAQM4+KjJh/0F9VlwZW1Q/TRFUxS/WrUAr/TYdQB5WenvDm0aoheMpy+afcTi/OGY6aG6jUg"
            + "iwcJ0oH5ebwv0HYC00m0l8pa/ZKprEv9mkoCHViR5unu6csD9DlSj9OBV/HPl6VeEo4d+7KQOT51X2FEzXyZRH8bzhkxb15Vtrzx"
            + "bZB0GlwMowJCGLh6EkJRQj1aBNHDp+7iQwW13hQKOoHDrxItLKeD+qFGLq1GjTeHS/MydYmftCydKfqJdv+GOL86ZoFaWI9Avx1X"
            + "KwrBt9LeCdUt0y62OqL7Vr8oBGOZDxqWhRP/mtRGLovWmEWfWg+5pilbOuf71skyUUrTkH3e/AcwE2pOehMMrYL9JvGoG0bC6VKa"
            + "ZsYrI6JsnhvCyAJrGvnkjXQYuRjYSOEzS38XT096PcKud+ofymLZtrA5n6dPcgjp7bZiQwNZlrqB9mSGu/BgMKxs0zFJc4PT9dLr"
            + "dDwES4LaSqMg4CfoBXedeRZCJKbh0DnTx+ZU4XYhljT8iKEoNnOVdtKNwFvKep35AsQA+ldT/yynI3dzMVV+Yuaw1Esef5FnLnNn"
            + "OkihGwNzfaaYehNpjtCDD6p0v7oxrQepK6tjn9Eb6KsSXS5PtspbCcySsNpGz5hH0t2KFloR2XLMxrDQEeBrnkEs6hpUupn0xbGF"
            + "0hr1tFMf7i486ebSkqcHmtLd63SkVi6iFbBrldFOmMXimzUkNXoCbwjdsw5zw8Fyr/MMWh1FGoxHHXSm1wGlNdTNVFZXsFqjVjtO"
            + "B+t3OjLPgE/gOVnlHZROZH1Ey6FoUGetbYrZVJN/dZ9mvfKoyaxseFWI02myHWlvIM+jbqmuafd9oJ8wihquEt5WwC0J3hx6H+Q3"
            + "0BI0mn94wdrqFM+STm5u/oKCH8eWXAVlRPLtccO72NsoK70teheNp67TUYedDq++4R8tjet0pOFWQC/uzMf5IbR8SoKui21nOXhY"
            + "qRzvJeW/SBl7JIyYc4Y/f4hwaIztICOd9jsdui65Tkcf52sOut/poDkTfSovHJMHN/9lFlrimsgCgrZQ6Bw5tLgQ08b8l5tIzgZo"
            + "lEceoDsLaOsNe5wOj1A3Ehqyp7DT4Rjgpc/oYrhu4bVMgfngiQxDghctKzdtXSA5S8Y3N8n4WM7fQKfrGOPBQWf/cy6nw63Zre10"
            + "OB1wNux0dB6enf19G5zN4oLmCj3V1TkAOZ7zt29llEoL0OnABA9H3fz22+VMTkfV73SkrtNRTbw1y24OQ56dDjrTQMNyYmk4boIW"
            + "40DO30Zueyg6jNvtQaAp0qHEsLApKevLdVik06F95VhgHi950e6pXdeeN4dW7gHPLgCaLMdY2Y2gNo+v4jlzlTYDKfAkFD0qOwha"
            + "+LiSwosv0tEhelk4AigmFNJ8kRksndbLziXzbZ6T2sloUlzPzgIOaLIcpc75INAjP+fRt9+gnmi2Qx/+Vf3GYdDc6XiRogfWZKSj"
            + "u7asfN0tAP2rlkEo0qFyyfztGzWHKqMX4dmx9SGgi85w3IyT0+0GuHg/PBqgRQ+/bEvDx44AzfWoE6MtJPutg4ZCNKWuc14lukRY"
            + "JWAac6qEcnkxcjETaC6OVSA9nVofaGmieRflLJxHzyO9NRScF4v7+0WmkR4C7Sqtpm6802iqWJXndjTarhKtvTUOtQJaLq0z6ypV"
            + "vqRdNdKDQLczCfrmHPZ51IHWokdyIvX1cqFID4P2qZvpLljK6ohVJX7FuKlRFHxKrFYSMJvcKqyuWPWn9U+D6wN9czznbxZnEzSZ"
            + "J/Qd6BfSAFsTCdqjtCxsv52of40mWqsSL0tnaKCqhnIR3p5VrG7ViAZ9LrPhanRdGa7RQqr0sI32KG2P/fZP9s+WKs3SG2wcyIW8"
            + "EKtYXxZ9TeEA6LNxfn7WQaNCa/4uNwBxoL1vZzgdGsMs88X9welQaV4evCn6c+FEqVj1dP1bKPaBPpazA/rZBW30GVBrmjjQ5tvp"
            + "TodwA7SLS0deqD3QbM/LVycNOg9fe3LBPCRoq2r0rY3yex2zPs4H+M+dPjugM7vDFgPao7Q6aNN+eyUjC/zyNZwCQffnImoRFquW"
            + "z0PVv5YkDPoMdkPp87lAG2/31VAjAdpg+PUr/KH/iPRkGB6MRJSAf4OflqTyZgJ+M6WEvEThGk/7+nLf60WHQYfVeVbMjuDcazqu"
            + "I00HE28n5cV1OtRFj4imb9mT6AXnNvXlQnnk7k9ZDGxVeSjoqxl2HA/n7DSGepggtjFM7bczfFduv3tB8/VMvaBxbtPDy0AejPfA"
            + "723Q7GygrwA0br09O8DfcEBL964L7ES7d6mptD6noxf0PTkdvUkWQyp/zyfi2cU64HQcCPqKg4Z4UDmK4fz87AVNY2XUYbnGDssD"
            + "DZPHdFh63o5HOr5+HaSoVwmPkNPRnwepLoWeTIPSuyD7INBXAnSLqGeH6POz2wVvF0vVXYnqggulVS+9tIdXfu0H/ZXawl47Tk5H"
            + "bx4StFmsQ07HIaA5V7DRm5+3LXRE0X6MRpGcTdB8FCdbPDw8HBBUclwqVKP0AO/uq3A6emSJGjCQh3I6lNxbc6xPAH3VgW7ev3+s"
            + "hP2I5WxpNCeNU8rb+DApB32vZGGoEerifa9Q3elPtIhJwMSMUu3rX4f2x44GfWWAfv/+ltuPDvW3HvvsgjYC/3Vk4J+PiBpz99Xb"
            + "2asCfCKmtQ0kGU7AuOmwfkr/Xg4B0OFuigT9/udNi/7HYxzn5x+slTE4y7/mUyA30UNZsE+DFUjTGiDmhOqc0B0G7+qThYjieRKG"
            + "9FuOWNBXLmhQamE/TMwBzj84S5COGpzNJ4Ywc63ToOTrfDDJcB6i0Ht+yrGgr7yg3/99y+3Ht9EQ5+cf/upd62VNnY4YnF3//968"
            + "qh/0VQA02I8G7cfmcdTTDHKF/mvMorph0GnfHlRpxJ5VQyekpcMJ/D/lDKCvwqCV/ejlfD7Qb1mjr3pBvwenGu6oH/s5X0APgr4a"
            + "AA2oK7Ifo5B9Rs4X0EOgr4ZBS6e6HP0Q5OwF7Sza+n5BuyF+L2hpP36DQVg/Zxd0h3i7vYC+igVNnXKyHwHODmjRXzFXEl1AD4Mm"
            + "+wHo/hj5MDugebCjm3z3fYP2jg6GQUOnnLZIHPk4W6CRM4Vba5qI2HzXoL2DsH2gyamGk/V8nE3QpM9tgQeWTQtt2UUM6NS/d6u1"
            + "NWvaszVr8KLxZep0Xwa2lTVuY2k06KvDQXOV/s3H2QAtFhXgAXx7Okgrdu7d+qSti+Mvro/bUDm1hpIjQF+FZhVcPQZBS8/Dy9kE"
            + "3ajFGyDT6KEslHyuiXoZNjfFOHs4ty6ma+9FpuaK0n502Qr2ilPRQTsX63dgSI/fh1vM4YbGaQTo0OyNMGjZF/dzNk0HjqTv8fy9"
            + "Pen0DDo8cVPCKCStRYEzpq2wrIygcbnK9Xvsi0zOvp10GcpRBJavVFC6qlb8/CmIi4ZC1KBgaCrYqtRuK81jqw4BTf2+AOifax5d"
            + "eg5w1kGT5ZhKzmBA4LTDyClhuNiyUNKIsVnAVZWFLmUNby83HsuqwryIaFZMjvd2ufGp1jne2xRijTCkrUtENofvQlLiJDEsMbnW"
            + "eFbw244CPQqD/jtZDc06O5xt0E2yl6DhQxEJOl2vqvJGSdGuhNaU7fTGFGxl+QAMsPyX72JO0byqkl+W1XxNvOAMRpUUWyXc2G5V"
            + "FTchKao5K7F11x9hnpUZD3oUBu1YDZfzjzbonQG6jZ17VxtApwBaHiM89bw/TFlmZFbcawlehOowVyXXwEgvA3V2gJYtIFu10yBo"
            + "0GgYrJ46+DXS0aBHQdAyJv3cw3kIdOzcO1Ohb6bSSAPLxAOAHymcmzdJmSE+AC25jsFGg156SwyMcNkDGr3awn/boRo9CoH+e+FY"
            + "DQ9nB7Rw7jjnXRlpOiyFvkn4zga4kqrxEpiiUs0DlX7GFXXWVY8SONdTv8pm/qKUT/GWJbQ9E2sT2CHQoxDoR9dq+Dg7oNtCNYbk"
            + "30V4HdTkJYY0YFZTaqmKm8QjCJMhS+/FAioEKqpMugIDMPYlJZRN4s0Fr7ZYCt1GEDfahZIdpNGjAGgcCceg//MQZwO09KN3vMOy"
            + "3zVy74Oh2aSg0OY7QiuE24eBXhZ+CFAU+cq+qxOYF5p1Dn2BWhtKWVR2GRsX21noAdLHiwFtbAqhg+Zh6N9Gg5x/fPej0zNspgnu"
            + "U7FPdmDKYnqG5GFZLzITbkfZsZySf6WnKBU++2JRga2Q/yirRi+uKbhtCh8obVNyabrcum+031U09GqqmONBjwKgfyar4QRGfZwt"
            + "0GJHkOkONHqHbpDck6VfozWF7v6/LUVb2Okln/0005QK6rV8b+pLKA5TaMZLBUXjNS0xl7bRe6/y+FftUVK6Air5qv5jQJuTvjrQ"
            + "Toe7l7MFmu9x02IPoKFsIubeUYvXvY96f8b7hUovoQNcanW5qXSWK+q9TbVSKLqsGvU95Fuv5vNGz0b0wPVHrfhXpUoGE4JW0BGd"
            + "Sp3v5gYOgvbscdL4XeegeQbO7979zQr8N9quY3XU3DtdoVvdCDK9CPDVIFShvih0ljSFfKUUsFElgsZBs+zUis31lKk4A7axv1pr"
            + "jcCsm3hmHaQzBNqZxAigN7LDPXqO5uyA3nbb6tWbmLl3hkIX3ZuV5HbMDZYQz0lruUGDARqcALyo1Qyl3bNWUS3aBnfhZFq3Wy4I"
            + "tx+FEdFSa22n2JVvJevuBKch0O5kUdTogNXo4+yApoeJnR6jxgxZo9f4qeZ26E6Hx2jrLKnpZDpoLV33cSznt8N0Phkkqic8qGI8"
            + "SkQBV6bTsaNQB9QJPcTdD9ozKfdRHDRVjg7i7ILutj6NGgUnhd4JxxuUb5rIj8gOVUr/N3XJxTcEUH6UoHfimxKZ81zVR/RURLwa"
            + "j+/gkjNlJoxHkeUq95qQL4X+oB4p7QXtm/z8SLs7bh6f4zi/excGfdC8DrLQ/EXA7+7elroEzGTJV5gogLX6OMc4EhrwLqdS3Igf"
            + "JamSvPPQ4g6r2MzfpmDjeAaLi955J5k/imkFB3I+EbSh0NMWHV7xGTvhBlao9MRyZ7PEj4yDLiSNqvs4RVMuPjeeXcFYF/c2iq2b"
            + "mq3CvhL1rqwmURodmMy/wYkyB3M+VaMZrpsWr1CAw6NBQXKlwgr+FAuyZNLM2nStj8weT9T6TMaj5F4AosU1dRpjSsPRu569N55H"
            + "B3M+DTQzFRo8YVnNye2YOyxLUSyJAVA0lLUys9IQJPhxptcSojwp+Q45ZcnPeWDOo/iAzGqFa3pgrGC312EXmgkKgR717XESpc8/"
            + "GpxP1GhSaKnENIah1HvFPQGOFZsxGruSAAs5mMOdDqYboX2pRnoK6k2KssmYfT4hX8/IzEcxPv2dj4VV1OmEEZadNkS3GtTo6EVA"
            + "Yc4DoH17pgdAG3D2fCdP/WXIj+3+Be9etoWIwmLASlwkBSM3URDdY/9PjPSgR12or5ks3TGV6ngm11xlxqNSfSxsRhMnsIff2Q45"
            + "LhEDenDRxIBbFwBtz/QfMB0lh4NhqL0ZVkId5tHthFiuYCS64SNlCb0rZ4n3gZUBd61py92e5wLBCvGZhi154VA0cQJTNfJSuYHS"
            + "w+D+OTlw3L8R/SjKAoPf81VNv4bSTA/R6DNxdrvgxv70vV1w/jJ7bxwS1Q9A86s0gkBBlOl+1/VIkCW5ttwQtKXISsLFLgZmIxPu"
            + "9jgqn/GpJ5DNDr6uRNybyUehT8EjtNgSQ5od5QHBj7Im0JhPcQDoc3G2QG8PAU0KvedvYwvSQk8gkf+AHQuL2Y5SI78WHJT9TnDA"
            + "7QyLaXexQDdRXsQQxZj/g1pGDDeNxUMhZck6E9Y9iokxB/EVFhBNUxB57pJyuDGM5/wcx/kE0NgogUILsJ1I1BCukyx3uzE334kq"
            + "hao1Lu66G0mJ26kADYaASlNcG/PmtktZi2Mj51qxVUx41urHYQy7mKrbNAewH/RRzaCXs2ujraMtejSaKQT8VajpkUyKqlEs9RIA"
            + "gUGTUrK0LmIhwPZICvQcVXOnJd1rKfmpKjg4rKpA2R3pazxB3YeW43N/Y1ietR1UoLdHuHeoRnVnNkoRbG8lFKivjWJpCo73Z5X3"
            + "IprzGnYoGHf1IkcnYx9IKQ1AV2x76XTgQGbhfcJ0cF4HX6R5Xs7vPtmgo907ctbUj59gAH4F9bX7qvGy3GOwM08VS+PiGOlBOyZy"
            + "GWM3D73vvZtNqW2hoLRXBFVoronv+bweDO1NWnswH+c+d/JLzDb/HtC06nqsdHTVvbH4alqpz0ogVkmA8q5EDCXl04jA4qpMGG2W"
            + "aSPbGxOO1GOTssr1SMfe0eey8k4Jq/Vtjevq8chuSkif3/1UHgka99TRFLrC4DvEHpRFwNEQh3Ii5nwB6CJxL5Y8hqlZ3KqkLjfM"
            + "gxknemlhNmp7rHlXbIkW6aDbksR4xIye4NFoPExB2xG9OTNnUug6co//zNifHLsjvH82HavIZAkdZnFWCViW8dSQGQ5F4yxGar1C"
            + "F5nKRGaMyOpiyitQMibMq44XzR8TXcWpHgPF2zDSkXT3Nbg1um/a7qTedocp0KqHP0Zn5fy3uANCAPT21tgnwDjKsNurge8ZERRs"
            + "MHFAJGWedC2Ht06NTKR5yGmP/JJPEcXWKlfBezP4YdS7OU+M95Vlbd1nnFpRKdB8LsDj6AjOAczccAwrNIHeOidX6QeKpZ0SqW/t"
            + "3UMzPn08tdPJizkf+Uhppy+5fXc30ZomR3Pppliv3acaCgv1Ll+V2n1zFjoeBKqscgqo3B77F9EfzDnmxBsADSbMPvdBrRRhnqUn"
            + "8KW1QoUZayesxSZMn+zPUmsNCq8vqWfRgH0Hc3eUTvPwfepkIXA76q2xNI0W0h/SHQyB/lRFHsMClQm9n4l9jM8rLl8xL6fpcY9M"
            + "g0c4Yaxvq29tRPLHKLDJiU8Cyvy3T5sDzmUGEx06MeYVhfyaNE2PvK9v+RtYK2ju9XAln5lQn3hudVl2537HneCEh/2x9ZtdZ0it"
            + "M7zjdmOfs3cmiTv7bVvjYX+T9Rte0Im2A44h1Y+V2JwPc+S5kVC6UNh1/pZBk08JJ9wZs4YgwFaf4yDUyENnYZIYHKoIh+Z9Xr9l"
            + "0KDScAKccZLmeQ6730af7Vtvb5u3qtDaueATPPB169Ty1zmrGp/TbMG1q9+mhdZPuk8zP+nXOn+dc67eJmYNNN8zeHNbOEPUr4EZ"
            + "noicB7YGfhug+abBoFfbs5nnSBNOD7zFoFqVr78DjcaOOE4Uvb19fY0usKPC985/+6DptByc/AyvXWxfUfBxDV+G8GY5G6DRevAQ"
            + "7Qbf/rVky0MrOKX+7XI2QdMmClnNeynNK0ktVtXk6zdrn13QfBZqVtXn637HdB5hAlb+hpXZD5qm8k0yOlrOJXKyuDnCYMUkZ29b"
            + "nb0aLYaAGJyQaA0DTfKTxcoRTmScc11+6wrtA60GCPLaOsXvZGGmPk8OHsh4W6DFjm+pDVo/4fYoYbkFOk2/B8i9oMUcocoZ6j9B"
            + "UlejvxPMvaDtin6OISbqESnQ7AJaGmn7VIzTVVrL8TtS6AHQ63w14eesDh5/Ea3Tk0mGecJ/8/V3JMn6Iv8NoJVPcDbv4Pw5XjT6"
            + "IhfQF9AX0Bc5Sf4XZQ05ytcxiEQAAAAASUVORK5CYII="
            + "'>"
            + "<h1>Add an addon to your TV</h1><p>Type the 4 digits shown on the TV, then paste the addon link (it ends in manifest.json).</p>"
            + "<form id=f><input name=code inputmode=numeric maxlength=4 placeholder='Code on the TV' autocomplete=off>"
            + "<textarea name=url placeholder='Paste the addon link here' autocapitalize=off autocorrect=off spellcheck=false></textarea>"
            + "<button>Send to TV</button></form><div id=m></div><script>"
            + "var c=location.search.match(/c=(\\d+)/);if(c){f.code.value=c[1]}"
            + "f.onsubmit=function(e){e.preventDefault();var b='code='+encodeURIComponent(f.code.value)+'&url='+encodeURIComponent(f.url.value);"
            + "fetch('/add',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:b}).then(function(r){return r.text()}).then(function(t){m.textContent=t;if(t.indexOf('Sent')==0)f.url.value=''})"
            + ".catch(function(){m.textContent='Could not reach the TV'})}</script></body></html>";

    /** Start listening with this code. Returns the address to open, or "". */
    synchronized String open(String c) {
        code = c == null ? "" : c;
        pending = "";
        wrong = 0;
        try {
            if (server == null) {
                try {
                    server = new ServerSocket(PORT);
                } catch (IOException busy) {
                    server = new ServerSocket(0);
                }
                Thread t = new Thread(this::acceptLoop, "tv-addon-inbox");
                t.setDaemon(true);
                t.start();
            }
            String ip = LogServer.address();
            return ip.isEmpty() ? "" : "http://" + ip + ":" + server.getLocalPort();
        } catch (Exception e) {
            return "";
        }
    }

    /** The link a phone sent, once; "" if none. */
    String take() {
        String p = pending;
        pending = "";
        return p;
    }

    synchronized void stop() {
        code = "";
        pending = "";
        try {
            if (server != null) {
                server.close();
            }
        } catch (IOException ignored) {
            // closing anyway
        }
        server = null;
    }

    private void acceptLoop() {
        while (true) {
            ServerSocket ss = server;
            if (ss == null || ss.isClosed()) {
                return;
            }
            try {
                final Socket sock = ss.accept();
                Thread t = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        serve(sock);
                    }
                }, "tv-addon-serve");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (server == null) {
                    return;
                }
            }
        }
    }

    private static String line(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) >= 0 && c != '\n') {
            if (c != '\r' && sb.length() < 4096) {
                sb.append((char) c);
            }
        }
        return c < 0 && sb.length() == 0 ? null : sb.toString();
    }

    private void serve(Socket sock) {
        try {
            sock.setSoTimeout(4000);
            InputStream in = sock.getInputStream();
            String req = line(in);
            if (req == null) {
                return;
            }
            int len = 0;
            String h;
            while ((h = line(in)) != null && h.length() > 0) {
                if (h.toLowerCase().startsWith("content-length:")) {
                    try {
                        len = Integer.parseInt(h.substring(15).trim());
                    } catch (NumberFormatException ignored) {
                        len = 0;
                    }
                }
            }
            String body = "", type = "text/plain; charset=utf-8", msg;
            if (req.startsWith("POST /add") && len > 0 && len <= 8192) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[1024];
                while (bo.size() < len) {
                    int n = in.read(buf, 0, Math.min(buf.length, len - bo.size()));
                    if (n < 0) {
                        break;
                    }
                    bo.write(buf, 0, n);
                }
                String code2 = "", url = "";
                for (String kv : bo.toString("UTF-8").split("&")) {
                    int eq = kv.indexOf('=');
                    if (eq < 0) {
                        continue;
                    }
                    String k = kv.substring(0, eq), v = URLDecoder.decode(kv.substring(eq + 1), "UTF-8").trim();
                    if (k.equals("code")) {
                        code2 = v;
                    } else if (k.equals("url")) {
                        url = v;
                    }
                }
                if (code.isEmpty() || wrong >= 5) {
                    msg = "The TV is not waiting for an addon right now";
                } else if (!code.equals(code2)) {
                    wrong++;
                    msg = "That code is not right";
                } else if (url.length() < 8) {
                    msg = "Paste the addon link first";
                } else {
                    pending = url;
                    msg = "Sent. Look at the TV.";
                }
                body = msg;
            } else {
                body = PAGE;
                type = "text/html; charset=utf-8";
            }
            byte[] b = body.getBytes("UTF-8");
            OutputStream out = sock.getOutputStream();
            out.write(("HTTP/1.1 200 OK\r\nContent-Type: " + type + "\r\nContent-Length: " + b.length
                    + "\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n").getBytes("UTF-8"));
            out.write(b);
            out.flush();
        } catch (IOException ignored) {
            // the browser went away
        } finally {
            try {
                sock.close();
            } catch (IOException ignored) {
                // nothing to do
            }
        }
    }
}
