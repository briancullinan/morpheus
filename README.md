
# Morpheus

DEMO: https://briancullinan.github.io/morpheus

LIVE DEV: https://www.twitch.tv/megamindbrian

TLDR; Morpheus can automate marketing contact, call centers tasks, web searches and scraping obviously, anything you use to test with web-driver, testing web apps, supplementing website features such as a lack of export feature or message logging. We've never explored better designs because of Content-Security-Policy
; we've engineered ourselves into a corner.

In the movie the Matrix, Morpheus prevails by communicating with the right persons.
Morpheus' purpose is to find The One. The One who shares the same goal.
That is the purpose of Morpheus.

![F1](./image1-48.jpeg?raw=true)

Philisophical: Combine 3D with programming. <- Combine THAT, with a Browser plugin and 
[DevTools](https://chromedevtools.github.io/devtools-protocol/) API.
Use the thing to find someone on LinkedIn that the thing I made is useful to (i.e. Purpose). 
Sell the thing I made to them.

I build it, let me know when it makes contact.

## Short term
1) DONE: Componentize engine, combine with Ace9
2) Give Morpheus form, animations and world geometry
3) Modularize goals, separate QVMs
4) POC DONE: Stream browser automation through plugin
5) Automate LinkedIn lobby, find gamers
6) Slippery onboarding, "Holy Shit!" moment
7) auto-exec on remote cloud for mobile testing
8) \mvjoin and follow remote player splines
9) \sync IndexedDB file-system with a Github Gist after CAS
10) Firefox automation plugin


## Content-Security-Policy:
It's worth a brief technical overview of the code. `eval()` is a dangerous function that converts plain
text into a callable procedure. This plugin doesn't use eval(), instead it includes an EMCAScript 2022+ 
parser on the backend and stores variables in a special array. It's probably pretty slow, so don't try 
anything more than 60 FPS with it.

Through this, the management of specific Chrome features can be passed to the web browser context.
Then a `run-access-token` can be granted through a popup dialog in the page. This is controlled by the
frontend.js, and the code is run by backend.js. Some variables like local window can also share their
state. This way, the backend code can call frontend code and update the engine or the editor or open
a link when someone clicks on it in game. Bi-direction communication of immediate-asynchronous variables.

This way, the plugin does not need `eval()` permissions, and the Content-Security-Policy does not need
to be disabled like it commonly is in Automation Mode for running on localhost.


## Privacy and protected information:
We don't collect anything. All information is stored in your local browser. Morpheus can't be responsible
for lost or stolen data.


## Use cases

What the heck is this? Can't stake a claim without providing evidence. Chrome DevTools is a powerful
API used by companies like JetBrains to automate Javascript testing and debugging. It works by 
interpreting the Javascript calls and making calls back to the IDE during execution. Rather than
exposing this functionality to basic users, Google has decided it should be locked away behind
walls of settings and guards. This plugin intends to explore the visual design of automating 
DevTools. 

How can many people benefit from something very complicate made very simple?

### Use case 1, the lowly call center
In my experience, there are call centers (*cough* Kaizer) that benefit from automated tools for
moving information between interconnected systems. i.e. There is a tracker for calls, and a separate 
tracker for emails, and a separate trackers for reservations. There are software vendors that supplement
these systems with tools that automate copying fields between screens to transfering entire data sets
because the original software vendor never provided import and export features. Banks also need this.

### Use case 2, the lowly software engineer
In my misery, I imagine a nightmare where people forget passwords to financial accounts. People's fingers
become too swollen to press buttons on a screen. A true horror, copy and paste isn't implement in a
way that's easy to use. A world, not unlike our own.

It's for this reason, I stopped programming web-forms. They aren't fun, and yet dozens of software
companies, and companies everywhere have little contact forms and careers pages and expect people to
type stuff into them. 

That isn't my grand vision for the web. I've replaced most of my web interaction
with entertainment or working on this game engine. I want to help other people do the same thing,
replace their work with entertainment, but not by devaluing the nature of the work. Instead, by 
increasing the visual appeal and making it more entertaining. Democratizing the nature of other
people's work.

### Use case 3, Neo the data scientist
Web scraping is fairly common knowledge, StartPage.com scours the internet for material, stores the
keywords in a database, and when you perform a search it searches the database for the best match. 
Is bascially how it works. 

We have these little tasks that are so natural on our phones, such as
opening the Email app, then switching to Contacts and making a call, then reading something on the
web through the Browser. People hardly focus on the time spent inbetween, but as data scientists
we can't spend a minute analyzing every record, we have to make assumptions and use rules on the
data to analyze the parts we need to get the right information.

I've commonly seen data presented in 3D, but I've rarely seen a scientist use 3D to work on the data.
There is usually a programming language getting in the way of people understanding the data for 
themselves. The programming barrier could be removed and "gameified" to keep the user's attention.

In the beginning of the Matrix, in Neo's apartment. He's using a web scraper to collect news articles and 
any evidence he can find about the Matrix. I certainly should have started a search engine in 1999, because
I understood this concept even back then. But just focusing on how to make that interface useful.

For example, if I look at a company on LinkedIn, I am automatically going to search for a legitimate
marketing website, a mailing address, municipal registration information (Deleware C-corp?), people
associated with the company, phone numbers, reviews, financial news, public records for lawsuits.
Automating all of those searches above, these are just regular web searches, would have saved me quite
a bit of heartache in the past.

### Use case 4, Quality assurance

Gameifying Code-Completion

Code-complete is having fully tested every branch of code for correctness by simulating 
using all possible input values and checking the output against a Matrix of expected results.

This is where things get the most interesting for me, because it's the most technical, and there
is the most obvious amount of failure here. Just to give a basic outline of software development,
step 1) someone comes to me and says "I have an idea for an app.", and I usually say "it sounds 
just like .... " Insta. But sometimes we get to step 2) start building the app. And that lasts
for about a month or 5. Finally, step 3), is when everyone stays up until midnight working
on one last bug that the automated testing process found.

This automated testing for a marketing page, or a web app, or even a mobile phone app, takes a long
time to engineer. Big software companies employ newbies to work on it because they need someone to
be willing to focus on it for a few years (3) before it makes them ill. It generally looks like code:

```nodejs
await browser.url('https://ahfarmer.github.io/calculator/');
const appWrapper = await browser.$('div#root')

await browser.react$('t', {
    props: { name: '7' }
}).click()
await browser.react$('t', {
    props: { name: 'x' }
}).click()
await browser.react$('t', {
    props: { name: '6' }
}).click()
await browser.react$('t', {
    props: { name: '=' }
}).click()
```

Source: https://webdriver.io/

"Next gen". This is not the web I envisioned, so I must build it and present it to you all.
Here it is, my grand vision for Morpheus. Pipe Chrome DevTools commands through a plugin from a
text editor inside the same browser window.

https://chromedevtools.github.io/devtools-protocol/tot/Page/

Then, use a little drag and drop graph builder to replace the code with widget actions, like UE5.
When the code runs, it creates a Tab, automates the task, then closes the tab and returns to the
3D model. You can also set breakpoints on the code or model.

Then use my technology with forcing Windows GDI, or X11 or Cocoa to refresh the window, and combine
Sikuli style desktop automation with OpenCV and the 3D model to automate the browser window and
desktop windows all in one.

#### There are 2 separate use cases for home grown automation

After spending countless hours programming this use case, I realized the only reason no one has 
made automation simpler, is simply because, no one else can. So I must do it, grass roots design.

### #2 More common

This is really what inspired because the current tooling doesn't help with this. When the quality
tester runs the automated test script, it pops open another browser window controlled by WebDriver.
That is the problem, I already have a browser open, use the same context and session I'm working in.
## OR
Stay completely out of the way. To fix this, sometimes a headless browser is sufficient. 
For my purposes, I created a Docker image with xvfb (X11 Virtual Frame Buffer).
That little inspired piece of technology that lets you use Linux and remote desktop without a video
card, unlike Windows. When I run my automated test script, it launches my virtual frame buffer in the
background and runs the browser on a full desktop that doesn't interfere with what I am currently
programming. I can also remote desktop into the container if I need to see the test as it's running.
I used this tech to take screenshots of every command step, in case of failure. All of this together
I need to present in a more consumable way.

### Use case 5, Content projection

This could finally be used to project a "Metro style" app on top of any existing app, but that is
stage 2.

Use the engine to create binary spaced partitions of data between multiple players at the same time
to create an interactive graph of objectives. Search the graph for interests and find goals using 
the same principals as spatial indexing for incentive alignment. Create a visual representation of
Star Trek like qualifications. No one will ever wonder "what should I do?" again. This is a data problem.

Project material, images to multiple sales pages/personal blog/custom stores, upload editorials to 
multiple platforms. In respect to code, all tokens should be interated for all code changes. Automatic
branching and merging for every line and rebuilding inbetween. The build system should search for bugs
and solutions on it own. The problem with all these testing tools is they all look the same, like code.
None of them look like a game.

Screen casting, Browser based [OBS](https://obsproject.com/) has never been done.

### Use case 6, Gamification of industries
Applying VR to grocery shopping (some people find it relaxing).
Using the engine for spatial control over real world mechanics like WebViz
VR meditation
3D ASMR
Game about charity, how to spend instead of... ugh.
Game fixing something, like mechanics training
Game inadvertently working for someone like Human Turk
Alternative to Zapier

