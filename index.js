
var mongocli = require("mongodb").MongoClient;
var mongoID = require('mongodb').ObjectID;
var koa = require('koa');
var router = require('koa-trie-router');
var mount = require('koa-mount')

var mongo = null;
var rest = koa();
rest.use(router(rest));

/**
 * Routes
 */
rest.route('/class/:clazz')
.get(function* (next){
	this.body = yield find(this.params.clazz, {});
})
.post(function* (next){
	var postData = { 'username':'weiss', 'password':'fjiw883hfjkspiasd;if' };
	var result = yield insert(this.params.clazz, postData);
	this.body = "done.";
});

rest.route('/class/:clazz/object/:id')
.get(function* (next){
	var result = yield find(this.params.clazz, { _id: mongoID(this.params.id) });
	if (result.length) {
		this.body = result[0];
	}
	else {
		this.body = { error:'object not exist.', id: this.params.id };
	}
});

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

function* find(collection, condition){
	condition = condition || {};
	var cursor = mongo.collection(collection).find(condition);
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
	var ret;
	yield function(done){
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
