
var mongocli = require("mongodb").MongoClient;
var mongoID = require('mongodb').ObjectID;
var koa = require('koa');
var router = require('koa-trie-router');
var mount = require('koa-mount');
var parse = require('co-body');
var qs = require('koa-qs');

var mongo = null;
var rest = koa();
qs(rest, 'first');
rest.use(router(rest));

/**
 * Routes
 */
rest.route('/class/:clazz')
	.get(function* (next){
		var size = parseInt(this.query._size);
		var order = (this.query._order == "asc") ? 1 : -1;
		this.body = yield find(this.params.clazz, {}, { _size: size, _order: order });
	})
	.post(function* (next){
		var body = yield parse.json(this);
		var result = yield insert(this.params.clazz, body);
		this.body = result;
	});

rest.route('/class/:clazz/object/:id')
	.get(function* (next){

		if (this.params.id.length !== 24) {
			this.body = { error:'mongoId error', id: this.params.id };
			return;
		}

		var result = yield find(this.params.clazz, { _id: mongoID(this.params.id) });
		if (result.length) {
			this.body = result[0];
		}
		else {
			this.body = { error:'object not exist.', id: this.params.id };
		}
	})
	.delete(function* (next){
		var result = yield remove(this.params.clazz, { _id: mongoID(this.params.id) });
		this.body = result;
	});

rest.route('/class/:clazz/list/:list')
	.get(function* (next){
		var size = parseInt(this.query._size);
		var order = (this.query._order == "asc") ? 1 : -1;
		var result = yield find(this.params.clazz, { _list: this.params.list }, { _size: size, _order: order });
		this.body = result;
	})
	.post(function* (next){
		var body = yield parse.json(this);
		body._list = this.params.list;
		var result = yield insert(this.params.clazz, body);
		this.body = result;
	})

rest.use(function *notFound(next){
	if (this.status == 404){
		this.body = { error:'rules not support.', version:'1.0' };
	}
	else {
		yield next;
	}
})
/**
 * Mongo functions
 */
function* connect(url){
	var mongo;
	yield function(done){
		mongocli.connect(url, function(err, db){
			mongo = db;
			done(err);
		});
	}
	return mongo;
}

function* find(collection, condition, options){
	if (!collection)	return;
	condition = condition || {};
	options = options || {};
	var _orderby = options._order || -1;
	var _size = options._size || 20;
	var cursor = mongo.collection(collection).find(condition).sort({ _id: _orderby }).limit(_size);
	var list = [];
	yield function(done){
		cursor.each(function(err, doc){
			if (doc) {
				list.push(doc);
			}
			else{
				done(err);
			}
		});
	};
	return list;
}

function* insert(collection, objects){
	if (!collection || !objects)	return;
	var ret;
	yield function(done){
		if (objects.length) {
			objects.forEach(function(obj){
				obj._create_time = +new Date;
			})
		}
		if (typeof objects === 'object') {
			objects._create_time = +new Date;
		}
		mongo.collection(collection).insert(objects, function(err, result){
			ret = result;
			done(err);
		});
	};
	return ret;
}

function* update(){}
function* append(){}

function* remove(collection, condition){
	if (!collection || !condition)	return;
	var ret;
	yield function(done) {
		mongo.collection(collection).remove(condition, function(err, result){
			ret = result;
			done(err);
		})
	}
	return ret;
}

/* thunkify */
function thunkify(fn){
	return function(){
		var args = [].slice.call(arguments);
		var ctx = this;
		return function(done){
			var ret;
			args.push(function(){
				ret = [].slice.call(arguments);
				done();
			});
			try {
				fn.call(ctx, args);
			}
			catch(err) {
				done(err);
			}
			return ret;
		}
	}
}

module.exports = function(options){
	options = options || {};
	return function*(next){
		mongo = yield connect(options.store||options.url);
		yield mount(options.route || '/', rest);
	};
};
