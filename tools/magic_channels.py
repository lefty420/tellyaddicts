#!/usr/bin/env python3
"""Magic Channels: the extra, themed channels the app shows when Options > Experimental > Magic Channels is on.

The lineup lives here, in one place. Running this script (from the repo root)
  * writes the channels into tools/shows.json (the app fetches that file, so a change needs no new APK),
  * rewrites the marked block in british-tv/app/src/main/assets/channels.js,
  * and prints, per channel, how many shows and episodes the library has for it, and any listed show it cannot find.

A magic channel is added to the channels a show is already on (a show can be on Sitcom Gold and Classic Sitcoms).
Fields:  shows   the library show names (spelling and "The" are forgiven)
         films   a film channel; `genres` keeps only the films with one of those TMDb genres
         xmas    keep only the Christmas episodes of the listed shows
         kids    a children's channel (no broadcaster channel, children's schedule)
"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOWS = os.path.join(ROOT, 'tools', 'shows.json')
LIB = os.path.join(ROOT, 'british-tv', 'data', 'library.json')
CHJS = os.path.join(ROOT, 'british-tv', 'app', 'src', 'main', 'assets', 'channels.js')

def S(text):
    return [x.strip() for x in text.strip().split('\n') if x.strip()]

LINEUP = [
 # ---------------- movies: the Video Shop shelf split by what the film is (certificates still decide when it plays)
 dict(id='mc_action', n=41, name='Action Movies', films=True, genres=['Action', 'Adventure', 'War', 'Western'], shows=['The Video Shop']),
 dict(id='mc_horror', n=42, name='Horror Night', films=True, genres=['Horror'], shows=['The Video Shop']),
 dict(id='mc_scifi_movies', n=43, name='Sci-Fi & Fantasy Movies', films=True, genres=['Science Fiction', 'Fantasy'], shows=['The Video Shop']),
 dict(id='mc_comedy_movies', n=44, name='Comedy Movies', films=True, genres=['Comedy'], shows=['The Video Shop']),
 dict(id='mc_thriller', n=45, name='Crime & Thrillers', films=True, genres=['Thriller', 'Crime', 'Mystery'], shows=['The Video Shop']),
 dict(id='mc_drama_movies', n=46, name='Drama & Romance', films=True, genres=['Drama', 'Romance', 'History', 'Music'], shows=['The Video Shop']),
 # ---------------- drama
 dict(id='mc_scifi', n=47, name='Sci-Fi & Fantasy TV', shows=S('''
Doctor Who
Blakes 7
Space 1999
Sapphire and Steel
Quatermass
The Tomorrow People
Survivors
Out of the Unknown
Red Dwarf
Babylon 5
Star Trek The Next Generation
Quantum Leap
The X-Files
Sliders
Buffy the Vampire Slayer
Space Precinct
Robin of Sherwood
Doomwatch
Catweazle
Hammer House of Horror
Tales of the Unexpected
The Man Who Fell to Earth
Chocky
Worzel Gummidge
''')),
 dict(id='mc_crime', n=48, name='Cops & Detectives', shows=S('''
Inspector Morse
Agatha Christies Poirot
Poirot
Miss Marple
Maigret
Sherlock Holmes
Bergerac
Lovejoy
Minder
Cracker
Prime Suspect
Wycliffe
Midsomer Murders
Resnick
Van der Valk
Cadfael
Columbo
Kojak
The Rockford Files
Murder She Wrote
Diagnosis Murder
Jonathan Creek
Randall and Hopkirk Deceased
Hetty Wainthropp Investigates
Rumpole of the Bailey
Silent Witness
Spooks
Between the Lines
Dempsey and Makepeace
The Chief
Strangers
Special Branch
Department S
Jason King
The Persuaders
Return of the Saint
The Protectors
The Professionals
The Sweeney
Z Cars
The Bill
Juliet Bravo
Heartbeat
Casualty
Hill Street Blues
Hart to Hart
Moonlighting
Pie in the Sky
The Detectives
City Central
Crown Court
Dick Turpin
''')),
 dict(id='mc_action_tv', n=49, name='Action Heroes', shows=S('''
The A-Team
Airwolf
Knight Rider
MacGyver
Miami Vice
Street Hawk
The Fall Guy
Charlies Angels
Wonder Woman
The Six Million Dollar Man
Walker Texas Ranger
Baywatch
The Incredible Hulk
Highway to Heaven
The Lone Ranger
Little House on the Prairie
The Waltons
The New Avengers
Robin of Sherwood
Flash Gordon
Skippy
Black Beauty
Lassie
''')),
 dict(id='mc_period', n=50, name='Period & Prestige Drama', shows=S('''
I Claudius
The Forsyte Saga
The Jewel in the Crown
Upstairs Downstairs
The Duchess of Duke Street
The Pallisers
Poldark
The Darling Buds of May
Tenko
Colditz
Secret Army
When the Boat Comes In
Our Friends in the North
Boys from the Blackstuff
Pennies from Heaven
All Creatures Great and Small
Lillie
Edge of Darkness
The Agatha Christie Hour
Play for Today
Armchair Theatre
Strangers
The Duchess of Duke Street
Ballykissangel
Hamish Macbeth
Rock Follies
The Box of Delights
''')),
 # ---------------- game shows
 dict(id='mc_quiz', n=51, name='Quiz Time', shows=S('''
Fifteen to One
Countdown
Mastermind
University Challenge
Going for Gold
Blockbusters
Telly Addicts
Connections
Ask the Family
Call My Bluff
Catchphrase
Family Fortunes
Mr and Mrs
Sale of the Century
Who Wants to Be a Millionaire
The Weakest Link
Wheel of Fortune
Jeopardy
Blankety Blank
Pass the Buck
Tell the Truth
Name That Tune
Play Your Cards Right
Give Us a Clue
Win Lose or Draw
Screen Test
Odd One Out
Face the Music
Small Talk
Strike It Rich
The Krypton Factor
Scrabble
Turnabout
Beat the Clock
The Pyramid Game
Jokers Wild
Bob's Full House
3-2-1
Bullseye
Winner Takes All
Pop Quiz
The Alphabet Game
Remote Control
Cluedo
Love at First Sight
Whittle
Sounds Familiar
First Class
''')),
 dict(id='mc_challenge', n=52, name='Challenge: Big Games', shows=S('''
The Crystal Maze
Gladiators
Fun House
Fort Boyard
Takeshi's Castle
Interceptor
Ice Warriors
Jungle Run
Knightmare
Treasure Hunt
Supermarket Sweep
The Generation Game
It's a Knockout
Superstars
Scrapheap Challenge
Don't Forget Your Toothbrush
You Bet
Big Break
Raise the Roof
Cyberzone
Get Your Own Back
Runaround
GamesMaster
Bad Influence
Games World
Finders Keepers
Incredible Games
Wipeout
Don't Try This at Home
You've Been Framed
Full Swing
Grand Slam
Singled Out
Runway
Noels House Party
Blind Date
''')),
 # ---------------- comedy
 dict(id='mc_sitcom_gold', n=53, name='Sitcom Gold', shows=S('''
Dads Army
Are You Being Served
Steptoe and Son
Porridge
Open All Hours
Rising Damp
Fawlty Towers
Only Fools and Horses
Yes Minister
Yes Prime Minister
Blackadder
Terry and June
Some Mothers Do Ave Em
Love Thy Neighbour
On the Buses
George and Mildred
Man About the House
Citizen Smith
Hi-de-Hi
Allo Allo
Last of the Summer Wine
In Sickness and in Health
Never the Twain
Sorry
The Liver Birds
Bless This House
Please Sir
Sykes
Mind Your Language
The Fall and Rise of Reginald Perrin
Butterflies
To the Manor Born
Whatever Happened to the Likely Lads
Dear John
Just Good Friends
Bread
No Place Like Home
Metal Mickey
Agony
After Henry
The Two of Us
Ripping Yarns
A Fine Romance
Second Thoughts
Duty Free
Whoops Apocalypse
Filthy Rich and Catflap
Happy Families
Never Mind the Quality
''')),
 dict(id='mc_sitcom90', n=54, name='Nineties Sitcoms & Cult Comedy', shows=S('''
Keeping Up Appearances
One Foot in the Grave
Waiting for God
As Time Goes By
Birds of a Feather
Men Behaving Badly
Goodnight Sweetheart
The Vicar of Dibley
Vicar of Dibley
Absolutely Fabulous
Father Ted
Black Books
Peep Show
Spaced
Game On
Gimme Gimme Gimme
Dinnerladies
The Thin Blue Line
Oh Doctor Beeching
So Haunt Me
The Piglet Files
2point4 Children
Next of Kin
How Do You Want Me
The Brittas Empire
The High Life
Chef
Red Dwarf
The Young Ones
Bottom
I'm Alan Partridge
Knowing Me Knowing You with Alan Partridge
Watching
Jeeves and Wooster
Kiss Me Kate
People Like Us
Chelmsford 123
The New Statesman
Get Back
''')),
 dict(id='mc_tgif', n=55, name='TGIF: Family Sitcoms', shows=S('''
Family Matters
Full House
Step by Step
Sister Sister
Boy Meets World
Sabrina the Teenage Witch
Saved by the Bell
Blossom
Home Improvement
The Wonder Years
Perfect Strangers
Charles in Charge
Growing Pains
Diffrent Strokes
The Facts of Life
Punky Brewster
Webster
Silver Spoons
ALF
Small Wonder
Mr Belvedere
Empty Nest
The Golden Girls
The Cosby Show
Mork and Mindy
Happy Days
Laverne and Shirley
The Brady Bunch
The Partridge Family
Kenan and Kel
Hey Dude
Clarissa Explains It All
The Nanny
Mad About You
Friends
Everybody Loves Raymond
Dharma and Greg
Just Shoot Me
Wings
The Simpsons
Roseanne
Married with Children
Newhart
Cheers
Frasier
Taxi
M*A*S*H
Barney Miller
Benson
Soap
''')),
 dict(id='mc_sketch', n=56, name='Sketch Shows & Stand-up', shows=S('''
Monty Pythons Flying Circus
The Two Ronnies
The Goodies
The Benny Hill Show
Not the Nine O Clock News
Alas Smith and Jones
Smith and Jones
A Bit of Fry and Laurie
The Fast Show
Harry Enfield
Big Train
The League of Gentlemen
Goodness Gracious Me
The Real McCoy
Naked Video
Little and Large
Cannon and Ball
Tommy Cooper
The Kenny Everett Television Show
Spitting Image
Brass Eye
The Day Today
The Comic Strip Presents
Chewin the Fat
TV Offal
Saturday Live
Whose Line Is It Anyway
Shooting Stars
Have I Got News for You
Never Mind the Buzzcocks
Room 101
Bob Monkhouse
Barrymore
The Paul Daniels Magic Show
Mr Bean
Live from the Palladium
Sunday Night at the London Palladium
Big Train
Vic Reeves Big Night Out
''')),
 # ---------------- entertainment
 dict(id='mc_light_ent', n=57, name='Light Entertainment', shows=S('''
The Generation Game
Noels House Party
Surprise Surprise
Blind Date
Barrymore
Big Break
You've Been Framed
The Two Ronnies
Little and Large
Cannon and Ball
New Faces
Eurovision Song Contest
Saturday Live
TFI Friday
The Word
The Tube
Whose Line Is It Anyway
Have I Got News for You
Telly Addicts
Wish You Were Here
This Is Your Life
You Bet
Gladiators
Royal Variety Performance
Live Aid
Sunday Night at the London Palladium
Live from the Palladium
Bob Monkhouse
The Paul Daniels Magic Show
The Krypton Factor
Tales of the Unexpected
''')),
 dict(id='mc_daytime', n=58, name='Daytime & Talk', shows=S('''
Oprah Winfrey
Jerry Springer
Ricki Lake
Kilroy
Sally Jessy Raphael
Montel Williams
Jenny Jones
The Jenny Jones Show
Maury
Donahue
This Morning with Richard Not Judy
GMTV
TV-am
Open Air
Going for Gold
Antiques Roadshow
Gardeners World
Watchdog
Points of View
Wish You Were Here
Ready Steady Cook
Masterchef
Supermarket Sweep
Countdown
Fifteen to One
''')),
 dict(id='mc_factual', n=59, name='Factual & Features', shows=S('''
Horizon
Tomorrow's World
Connections
Antiques Roadshow
Gardeners World
Newsround
Watchdog
Wish You Were Here
Points of View
Match of the Day
Scrapheap Challenge
Escape to River Cottage
This Is Your Life
Blue Peter
Live Aid
Test Card
On This Day
Horizon
''')),
 # ---------------- kids
 dict(id='mc_toons80', n=60, name='Saturday Morning Toons', kids=True, shows=S('''
He-Man
The New Adventures of He-Man
She-Ra
Transformers
G.I. Joe
ThunderCats
M.A.S.K.
The Real Ghostbusters
Inspector Gadget
Jayce and the Wheeled Warriors
Voltron
SilverHawks
Visionaries: Knights of the Magical Light
Bravestarr
Dungeons & Dragons
The Mysterious Cities of Gold
Defenders of the Earth
Robotech
Captain Power and the Soldiers of the Future
Centurions
Sectaurs
Inhumanoids
Bionic Six
Starcom: The U.S. Space Force
Jem
Mighty Orbots
Ring Raiders
Sky Commanders
Dino-Riders
Dinosaucers
Pole Position
Battle of the Planets
Teenage Mutant Hero Turtles
Terrahawks
Blackstar
The Real Adventures of Jonny Quest
Saturday Supercade
Pac-Man
Spiral Zone
Rainbow Brite
Zillion
C.O.P.S.
Action Force
Action Man
Fantastic Four
Iron Man
Challenge of the GoBots
''')),
 dict(id='mc_toons90', n=61, name='90s Toon Zone', kids=True, shows=S('''
Batman The Animated Series
X-Men
Spider-Man The Animated Series
Animaniacs
Pinky and the Brain
Tiny Toon Adventures
Taz-Mania
Rugrats
Doug
Hey Arnold
Aaahh Real Monsters
Ren and Stimpy
Gargoyles
Darkwing Duck
Goof Troop
Freakazoid
ReBoot
Biker Mice from Mars
Swat Kats
Street Sharks
Extreme Dinosaurs
Extreme Ghostbusters
Sonic the Hedgehog
Adventures of Sonic the Hedgehog
Sonic Underground
Pokemon
Sailor Moon
Bishoujo Senshi Sailor Moon
Mega Man
Samurai Pizza Cats
The Tick
The Savage Dragon
Superman The Animated Series
Mighty Max
Earthworm Jim
Men in Black The Series
Digimon
Monster Rancher
Street Fighter
Mortal Kombat Defenders of the Realm
Captain Planet
Roughnecks
Conan the Adventurer
Cadillacs and Dinosaurs
Where on Earth Is Carmen Sandiego
Beast Wars
Max Steel
G.I. Joe Extreme
RoboCop Alpha Commando
Godzilla The Series
Teknoman
Skeleton Warriors
Ultraforce
WildC.A.T.s
Big Guy and Rusty
Cybersix
Shadow Raiders
War Planets
Bureau of Alien Detectors
The Bots Master
Moo Mesa
Space Precinct
Phantom 2040
James Bond Jr
Prince Valiant
The Pirates of Dark Water
Tales from the Cryptkeeper
Are You Afraid of the Dark
Goosebumps
Round the Twist
''')),
 dict(id='mc_toons_classic', n=62, name='Cartoon Classics', kids=True, shows=S('''
Looney Tunes
Tom and Jerry
Popeye
The Flintstones
The Flintstone Kids
The Jetsons
Top Cat
Yogi Bear
Scooby Doo
Wacky Races
Hong Kong Phooey
The Pink Panther
Speed Racer
Jonny Quest
The Smurfs
The Snorks
Muppet Babies
Gummi Bears
DuckTales
Alvin and the Chipmunks
Garfield and Friends
Care Bears
My Little Pony
Strawberry Shortcake
Pound Puppies
The Raccoons
Fraggle Rock
Danger Mouse
Count Duckula
SuperTed
Bananaman
Dogtanian
Willy Fog
Ulysses 31
Maya the Bee
Tintin
Peter Pan and the Pirates
The Mr Men Show
Super Mario Bros
Super Mario World
The Legend of Zelda
Captain N: The Game Master
Donkey Kong Country
The Addams Family
The New Adventures of Batman
The New Adventures of Flash Gordon
The Get Along Gang
Teddy Ruxpin
Pocket Dragon
Wing Commander Academy
Disney Cartoon
Walt Disney Cartoon
Donald Duck
Mickey Mouse
Goofy
Huey Dewey and Louie
Chip n Dale
Oswald the Lucky Rabbit
Silly Symphonies
Silly Symphony
The Three Caballeros
Pluto
''')),
 dict(id='mc_cbbc', n=63, name='Children\'s TV Favourites', kids=True, shows=S('''
Grange Hill
Byker Grove
Blue Peter
Newsround
Swap Shop
Basil Brush
Chucklevision
Art Attack
Finders Keepers
Knightmare
Press Gang
Maid Marian and her Merry Men
The Demon Headmaster
The Queens Nose
Worzel Gummidge
The Tomorrow People
Aquila
Bernard's Watch
My Parents Are Aliens
Live and Kicking
Smart
Words and Pictures
Fun House
Get Fresh
Bodger and Badger
The Adventure Game
Catweazle
Hacker
Black Beauty
Lassie
Skippy
Super Gran
Chocky
The Box of Delights
The Sooty Show
Dennis the Menace
The Animals of Farthing Wood
Spywatch
Jakers
Sapphire and Steel
The Adventures of Pete and Pete
Clarissa Explains It All
Hey Dude
Heartbreak High
Dungeons & Dragons
''')),
 dict(id='mc_nursery', n=64, name='Toytown & Nursery', kids=True, shows=S('''
Bagpuss
The Clangers
Ivor the Engine
The Magic Roundabout
The Herbs
The Wombles
Postman Pat
Fireman Sam
Thomas and Friends
Rainbow
Button Moon
Pingu
Morph
The Amazing Adventures of Morph
Mr Benn
Captain Pugwash
The Trap Door
The Raggy Dolls
The Shoe People
The Poddington Peas
Family-Ness
The Family-Ness
Willo the Wisp
Jamie and the Magic Torch
Chorlton and the Wheelies
Bod
Paddington
The Wind in the Willows
Noddy
Spot
Charlie Chalk
Penny Crayon
Rupert
TUGS
Bertha
Jimbo and the Jet-Set
The Dreamstone
Teddy Ruxpin
Humphrey the Bear
Rupert
Spot
''')),
 dict(id='mc_teen', n=65, name='Teen TV', kids=True, shows=S('''
Saved by the Bell
Boy Meets World
Sister Sister
Blossom
Sabrina the Teenage Witch
Hey Dude
Clarissa Explains It All
The Adventures of Pete and Pete
Byker Grove
Grange Hill
Press Gang
Heartbreak High
Kenan and Kel
Are You Afraid of the Dark
Goosebumps
Round the Twist
Live and Kicking
The Real World
Daria
Beavis and Butt-Head
Buffy the Vampire Slayer
Bad Influence
Game On
Roswell Conspiracies
Smart
The Tomorrow People
Sailor Moon
Pokemon
Digimon
''')),
 # ---------------- music
 dict(id='mc_pop', n=66, name='Pop & Chart', shows=S('''
Top of the Pops
The Chart Show
Hit List UK
Smash Hits Poll Winners
The O-Zone
Dance Energy
Supersonic
Revolver
Rapido
The Roxy
Solid Gold
American Bandstand
Soul Train
Live Aid
The White Room
Never Mind the Buzzcocks
TFI Friday
The Word
The Tube
Later with Jools Holland
Party Zone
Pop Quiz
Cheggers Plays Pop
MTV Top 20 Countdown
MTV Most Wanted
Club MTV
Dial MTV
Total Request Live
''')),
 dict(id='mc_rock', n=67, name='Rock & Alternative', shows=S('''
120 Minutes
Headbangers Ball
Alternative Nation
MTV Unplugged
The Old Grey Whistle Test
Later with Jools Holland
Rock Goes to College
Snub TV
The Tube
Beavis and Butt-Head
Liquid Television
Yo! MTV Raps
The Grind
MTV Dance
MTV Europe
MTV News
MTV Video Music Awards
MTV Spring Break
Celebrity Deathmatch
Singled Out
''')),
 # ---------------- soaps
 dict(id='mc_aussie', n=68, name='Aussie Soaps', shows=S('''
Neighbours
Home and Away
Sons and Daughters
The Sullivans
Heartbreak High
''')),
 dict(id='mc_uk_soaps', n=69, name='Street Life: UK Soaps', shows=S('''
EastEnders
Coronation Street
Emmerdale
Brookside
Crossroads
Hollyoaks
Eldorado
Albion Market
Families
Take the High Road
Howards' Way
Angels
The Brothers
''')),
 dict(id='mc_us_soaps', n=70, name='Dallas, Dynasty & Co', shows=S('''
Dallas
Dynasty
Knots Landing
The Colbys
Santa Barbara
''')),
 # ---------------- cooking
 dict(id='mc_kitchen', n=71, name='Kitchen Table', shows=S('''
Delia Smith's Cookery Course
Delia Smith's How to Cook
Keith Floyd
Floyd on Italy
Ready Steady Cook
Two Fat Ladies
Masterchef
Fanny Cradock Cooks for Christmas
Escape to River Cottage
Supermarket Sweep
Gardeners World
Wish You Were Here
Antiques Roadshow
''')),
 # ---------------- Christmas: only the Christmas episodes of the listed shows
 dict(id='mc_xmas_comedy', n=72, name='Christmas Comedy', xmas=True, shows=S('''
Only Fools and Horses
Last of the Summer Wine
Dads Army
Are You Being Served
Allo Allo
Some Mothers Do Ave Em
In Sickness and in Health
Keeping Up Appearances
Bread
Steptoe and Son
Terry and June
George and Mildred
Mr Bean
Little and Large
Blankety Blank
The Generation Game
Give Us a Clue
Cluedo
2point4 Children
One Foot in the Grave
Red Dwarf
Fawlty Towers
The Vicar of Dibley
Vicar of Dibley
Absolutely Fabulous
Father Ted
Blackadder
Hi-de-Hi
Home Improvement
Alice
The Jeffersons
M*A*S*H
Punky Brewster
ALF
Benson
Coach
Everybody Loves Raymond
All in the Family
''')),
 dict(id='mc_xmas_soaps', n=73, name='Christmas Soaps & Drama', xmas=True, shows=S('''
Santa Barbara
Crossroads
EastEnders
Coronation Street
Emmerdale
The Bill
Bergerac
Doctor Who
Maigret
Minder
Miss Marple
All Creatures Great and Small
The Waltons
Casualty
Brookside
Neighbours
Home and Away
Dallas
Dynasty
Knots Landing
Heartbeat
Inspector Morse
Lovejoy
Poirot
Agatha Christies Poirot
''')),
 dict(id='mc_xmas_toons', n=74, name='Christmas Cartoons & Kids', kids=True, xmas=True, shows=S('''
Thomas and Friends
Mickey Mouse
He-Man
Looney Tunes
Tom and Jerry
Popeye
Silly Symphony
Silly Symphonies
DuckTales
Paddington
Chucklevision
Basil Brush
The Sooty Show
Sonic the Hedgehog
Adventures of Sonic the Hedgehog
Alvin and the Chipmunks
Animaniacs
The Addams Family
M.A.S.K.
Garfield and Friends
Count Duckula
Danger Mouse
Postman Pat
Fireman Sam
Rainbow
Muppet Babies
The Smurfs
Scooby Doo
Transformers
G.I. Joe
ThunderCats
The Real Ghostbusters
Inspector Gadget
Donald Duck
Goofy
Disney Cartoon
Disney Classic
''')),
 dict(id='mc_xmas_pop', n=75, name='Christmas Pop', xmas=True, shows=S('''
Top of the Pops
The Chart Show
MTV
mtv xmas
vhs christmas
hits christmas
magic christmas hits
mtv christmas
Christmas Songs
Continuity
GamesMaster
The Tube
The Word
Later with Jools Holland
''')),
]

def norm(t):
    t = t.lower().replace('&', ' and ').replace("'", '').replace('’', '')
    return re.sub(r'^the ', '', re.sub(r'[^a-z0-9]+', ' ', t).strip())

def main():
    lib = json.load(open(LIB))['shows']
    by = {norm(s['n']): s for s in lib}
    shows = json.load(open(SHOWS))
    for k in [k for k, v in shows.items() if v.get('magic')]:
        del shows[k]
    for ch in LINEUP:
        seen, names, miss, eps = set(), [], [], 0
        for n in ch['shows']:
            k = norm(n)
            if k in seen: continue
            seen.add(k)
            s = by.get(k)
            if not s: miss.append(n); continue
            names.append(s['n'])
            if ch.get('xmas'): eps += sum(1 for e in s['e'] if e.get('xmas'))
            elif ch.get('genres'):
                g = set(ch['genres']); eps += sum(1 for e in s['e'] if g & set(x.strip() for x in (e.get('g') or '').split(',')))
            else: eps += len(s['e'])
        o = {'name': ch['name'], 'magic': True, 'extra': True, 'shows': names}
        for f in ('films', 'genres', 'xmas', 'kids'):
            if ch.get(f): o[f] = ch[f]
        shows[ch['id']] = o
        print('%-18s %-34s shows %3d  episodes %5d%s' % (ch['id'], ch['name'], len(names), eps, '   MISSING: ' + ', '.join(miss) if miss else ''))
    json.dump(shows, open(SHOWS, 'w'), indent=2, ensure_ascii=False); open(SHOWS, 'a').write('\n')
    # channels.js: the block between the markers
    rows = []
    for ch in LINEUP:
        rows.append("  { n: %d, id: '%s', name: %s, magic: true, maxItems: 120, sources: [{ data: '%s' }] }" % (ch['n'], ch['id'], json.dumps(ch['name'], ensure_ascii=False).replace('"', "'") if "'" not in ch['name'] else json.dumps(ch['name'], ensure_ascii=False), ch['id']))
    block = "// MAGIC-CHANNELS-BEGIN (generated by tools/magic_channels.py: edit the lineup there)\nwindow.CHANNELS = window.CHANNELS.concat([\n" + ',\n'.join(rows) + "\n]);\n// MAGIC-CHANNELS-END"
    js = open(CHJS).read()
    if 'MAGIC-CHANNELS-BEGIN' in js:
        js = re.sub(r'// MAGIC-CHANNELS-BEGIN.*?// MAGIC-CHANNELS-END', lambda m: block, js, flags=re.S)
    else:
        js = js.rstrip('\n') + '\n\n' + block + '\n'
    open(CHJS, 'w').write(js)

if __name__ == '__main__':
    main()
