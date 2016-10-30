[Elm](http://elm-lang.org/) is a really cool functional programming language used for front end development. Use it to build
cross platform desktop apps with [Electron](http://electron.atom.io/) and [Webpack](https://webpack.github.io/).


# A guide, not a template
You can find starter templates for a lot of frameworks in the javascript ecosystem. They aren't helpful. 
Templates make your life harder. When something goes wrong or your code veers slightly from the template,
you'll be fighting a beast that you likely do not understand. More so, the template probably includes
packages and settings that you don't need.

So here it goes.

# Create some folders and files
Whenever you see *Project-Name* you should substitute it with the name of your project. Per traditon,
let's put your project files in a folder called Project-Name: `mkdir Project-Name`

Now let's make a few files and folders. 

```
$ cd Project-Name
$ touch README.md webpack.config.js 
$ mkdir src src/elm src/static
$ npm init
```

After `npm init` you'll be presented with a few questions about the project. Answer them or keep pressing enter. Now 
is a good time to initialize git and make your first commit.

Note that the `/elm` and `/static` folders inside `/src` are how I choose to structure my elm projects. Elm files have their
place, and js/html/css go into static. 


# Electron 
Electron allows you to use web technologies to build desktop apps. As of now, Elm compiles to javascript. That's why 
we can use Elm to build desktop apps. The goal in this section is to get an electron window displaying "Hello Electron". We won't 
be using Elm yet.

First make sure electron is globally installed.

```
$ sudo npm install -g electron
```

Electron has a Main process and a Renderer process. You can think of the Main process as the code that interacts with the 
file system and desktop with node.js. It's a local server. The Renderer process is where you write the front end code that
the user interacts with. You can send data between processes using [ipc](http://electron.atom.io/docs/api/ipc-main/).

Let's create two files to see this in action.

```
$ touch main.js src/static/index.html
```

Fill in the index.html file with text that shows you that this is working.

```html
<html>
	
  <head>
   <title>This title shows at the top</title>
  </head>

  <body>
    <h2>Hello Electron</h2>
  </body>
</html>
```

And now the main.js file.

```js
'use strict'
const electron = require('electron')

const app = electron.app // this is our app
const BrowserWindow = electron.BrowserWindow // This is a Module that creates windows  

let mainWindow // saves a global reference to mainWindow so it doesn't get garbage collected

app.on('ready', createWindow) // called when electron has initialized

// This will create our app window, no surprise there
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1024, 
    height: 768
  })

  // display the index.html file
  mainWindow.loadURL(`file://${ __dirname }/src/static/index.html`)
  
  // open dev tools by default so we can see any console errors
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

/* Mac Specific things */

// when you close all the windows on a non-mac OS it quits the app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { app.quit() }
})

// if there is no mainWindow it creates one (like when you click the dock icon)
app.on('activate', () => {
  if (mainWindow === null) { createWindow() }
})
```

This code is well commented. When we run this file, it will create a window of the specified size and
create other application lifecycle methods. Notice the line:
`mainWindow.loadURL(`file://${ __dirname }/src/static/index.html`)`
That's where we tell our electron app to load the html file we created earlier. 

```
$ electron main.js
```  

Glorious.

# Elm 
Now for the fun part. Here's how this goes when electron isn't in the picture.

- write some elm code
- run `elm make Main.elm --output bundle.js` which compiles the elm code into javascript 
- import bundle.js into javascript and embed it into a div in your html.

That's still the general flow. Let's do this for real.

```
$ touch src/elm/Main.elm
``` 

Finally some Elm code.

```elm
module Main exposing (..)

import Html exposing (text)


main =
    text "Hello Electron. I'm Elm."
```

Now let's turn this Elm code into javascript. 
First, install elm package using:

```
sudo npm install -g elm
```
Once installed, issue "elm make" command below that will turn the Elm code into javascript. Elm will also install some packages.

```
$ elm make src/elm/Main.elm --output src/static/bundle.js 
```

The output file, bundle.js, is being put into the static folder. This is temporary for convenience.
It's easier to import into the html file for lazy people since it is in the same directory. Many future 
decisions, but not all, are driven by laziness. But only when quality isn't at stake.

Edit the index.html file to import the new bundle.js file and embed it into a div.

```html
<html>
	
  <head>
   <title>This title shows at the top</title>
  </head>

  <body>
    <div id='container'></div>
    <script src="bundle.js"></script>
    <script>
        var Elm = require('./bundle.js');
        var container = document.getElementById('container');
        var app = Elm.Main.embed(container);
    </script>
</html>
```

Here you are grabbing the container div and embedding the javascript code in there. Elm automatically
creates the Main.embed function during compilation. 

A few more housekeeping items before we see this in action. 

When you ran `elm make` some Elm packages were downloaded and an elm-package.json file was created.
All is good, except elm doesn't know where to look for your elm files. Update the elm-package.json source-directories 
to point to the location of your elm files.

```json
"source-directories": [
    "src/elm"
],
```

Run `electron main.js` and you'll see "Hello Electron. I'm Elm."

This setup is all you need to build electron apps in Elm. However, you'll be missing out on some of the 
latest and greatest web dev tools like hot reloading and automatic compilation. That's where webpack
comes in.

# Webpack 

Webpack is hard to wrap your head around, but it's awesome so let's try to understand it.

What is webpack?
The modern web stack is made up of many different parts. You could be using coffeescript or elm or
clojurescript, sass or less, jade, etc. And they all depend on each other. A coffee file might be 
importing another coffee file, which is being used by a jade file. The dependency graph can get wild.
Webpack takes all your files and automatically transforms them in to static assets - a clean set of
javascript and css files.

In our case, webpack is going to take all of our Elm, javascript, css (or sass if that's how you roll) files
and turn them in to static modules. Note that webpack can only consume javascript, so we need to use 
loaders that convert our elm code into javascript.

Let's get our Elm file working using webpack rather than reading the output of `elm make`.

[Install webpack](http://webpack.github.io/docs/installation.html)

You can use webpack from the command line, but to do anything serious (like converting Elm to js)
you need a config file. We already created one: *webpack.config.js*. Let's create a directory for the 
webpack output file so things don't get messy in the root of our project. While we're at it, let's create
an index.js file because as I mentioned earlier, webpack can only consume js. It can't import our index.html
file unless we convert that to js with a loader.

```
$ mkdir dist
$ touch src/static/index.js
$ rm src/static/bundle.js
```

I removed the bundle.js file we created earlier. That will no longer be used because we are 
going to use the one that webpack makes in /dist/bundle.js.

And now edit the webpack.config.js file.

```js
module.exports = {
    entry: './src/static/index.js',
    output: {
        path: './dist',
        filename: 'bundle.js'
    }
}
```

That seems scary, but it's not so bad. Every time you run the *webpack* command, webpack will
check this file to see what it should do. We are saying that webpack should look for the index.js 
file, do its magic, and then export a file named bundle.js to the /dist directory.

Our index.js file is empty right now. It should include the javascript we used to embed Elm into 
the div. Remove that js from the html file and put it in index.js like so.

```js
var Elm = require('../elm/Main');
var container = document.getElementById('container');
var app = Elm.Main.embed(container);
```

This code is mostly the same except you need to require the Main.elm file directly. Run *webpack* 
and see what happens. *Error: cannot resolve ... elm/Main ...* or something like that. What it's 
saying is that webpack doesn't know how to consume an Elm file. We need a loader to convert the 
Elm file to a js file. 

```
$ npm install --save elm-webpack-loader 
```

And now configure webpack to use the loader.

```js
module.exports = {
    entry: './src/static/index.js',
    output: {
        path: './dist',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test:    /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],
                loader:  'elm-webpack?verbose=true&warn=true',
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.elm']
    }
}
```

The elm loader is going to compile the .elm files into .js before webpack does its bundling magic. 
Under the hood webpack uses *elm make* just like we did above. We could skip using the loader if we 
wanted to manually make the elm files every time, but webpack automates it for us now.


If you run *webpack* now, you'll see the bundle file get created in /dist, but when you run electron 
you won't see the "Hello Electron. I'm Elm." text. The reason is because the html file that electron 
is running is not importing the new bundle.js file. In fact, it's not importing anything. Let's change 
that.

```html
<html>
	
  <head>
   <title>This title shows at the top</title>
  </head>

  <body>
    <div id='container'></div>
    <script src='../../dist/bundle.js'></script>
</html>
``` 

Try running `electron main.js` now and you'll see the message!

Here's an overview:
- Elm files go to webpack loader and get turned into js 
- New js files are consumed by webpack and turned into one file, bundle.js 
- Electron opens our index.html file, which imports the new bundle.js 

# Webpack dev server

That's a solid workflow, but things can get even cooler. Instead of running webpack and electron every
time there's a change, what if changes could be automatically injected into your electron window (which 
is really just a chrome browser window) every time you save your code?

Install 

```
$ npm install webpack-dev-server
```

Webpack-dev-server helps us do just that. It creates a node.js express server, and that allows us to watch 
for files changes and serve. Edit the webpack.config.js file:

```js
module.exports = {
    entry: './src/static/index.js',
    output: {
        path: './dist',
        publicPath: '/assets/',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test:    /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],
                loader:  'elm-webpack?verbose=true&warn=true',
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.elm']
    }
}
```

All I did here was add `publicPath: '/assets/'`. That tells webpack-dev-server to make bundle.js 
available at `http://localhost:8080/assets/bundle.js` instead of in your /dist directory. Let's 
see if that is indeed the case. First we need to update our html file to search for the bundle 
file on the server rather than in /dist.

```html
<html>
	
  <head>
   <title>This title shows at the top</title>
  </head>

  <body>
    <div id='container'></div>
    <!--<script src='../../dist/bundle.js'></script>-->
    <script src='http://localhost:8080/assets/bundle.js'></script>
</html>
``` 

Now run webpack-dev-server

```
$ webpack-dev-server --content-base /dist
```

This is just telling webpack-dev-server to watch the files in /dist. Open electron again and you will see
the same text from the .elm file as we saw before. If you change that text you'll see a lot of output in your 
terminal. That is webpack at work recreating your bundle.js. Reload the electron browser to see things updated.

That's really cool! But the browser should automatically refresh on save, right? Right.

Simply add `devServer: { inline: true }` to your webpack.config.js file.

```js
module.exports = {
    entry: './src/static/index.js',
    output: {
        path: './dist',
        publicPath: '/assets/',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test:    /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],
                loader:  'elm-webpack?verbose=true&warn=true',
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.elm']
    },
    devServer: { inline: true }
}
```

And run `webpack-dev-server --content-base /dist` again. Now when you make changes in Main.elm webpack 
will recompile everything and refresh the browser.

This is a very good development setup. You may want to explore [hot module replacement](https://webpack.github.io/docs/hot-module-replacement-with-webpack.html#what-is-needed-to-use-it)
so only the components you change are refreshed, not the entire page. I'll leave that to you... for now.


# About me
I'm [John Omar](http://johnomar.com/). I really like Elm, so I decided to make some beginner friendly tutorials to get more 
people using it. Hit me up on [twitter](https://twitter.com/johnomarkid) if you need help.
