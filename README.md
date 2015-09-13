# mongohub
Restful API for MongoDB.

### Usage

#### koa deploy
```js
var koa = require('koa');
var mongohub = require('mongohub');

var app = koa();

app.use(mongohub({
    url: 'mongodb://user:pass@localhost:27017/dbname?authSource=admin',
    route: '/'
}));
```

#### http route rules
```
http://localhost/class/:class
http://localhost/class/:class/object/:objectID
```
