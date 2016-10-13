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