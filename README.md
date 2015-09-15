# mongohub
Restful API for MongoDB.

## Usage

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

## Rules
`http://example.com/class/:class`
- `GET` 获取 :class 中的对象集合
- `POST` 向 :class 添加新对象

`http://example.com/class/:class/object/:objectID`
- `GET` 获取 ID=:objectID 的对象
- `DELETE` 删除 ID=:objectID 的对象
- `PUT` 用新对象替换 ID=:objectID 的对象
- `PATCH` 更新 ID=:objectID 的对象字段

`http://example.com/class/:class/list/:list`
- `GET` 获取 :class 中 :list 列表的对象
- `POST` 向 :class 的 :list 列表添加新对象
