(function(){
"use strict";

var fc={};

function log()
{
	console.log.apply(console,slice(arguments));
	return arguments.length;
}
function error()
{
	console.error.apply(console,slice(arguments));
	return arguments.length;
}

if(typeof(window)!=='undefined' && typeof(window.setImmediate)==="undefined")
{
	var immediates={};
	window.setImmediate=function(f){
		var id=Date.now()+""+Math.random();
		var args=slice(arguments,1);
		var evt=function(event){
			if(event.data===id)
			{
				f.apply(window,args);
				window.removeEventListener("message",evt);
				delete immediates[id];
			}
		};
		immediates[id]=evt;
		window.addEventListener("message",evt);
		window.postMessage(id,"*");
		return id;
	}
	window.clearImmediate=function(id){
		if(hasOwn(immediates,id))
		{
			window.removeEventListener('message',immediates[id]);
			delete immediates[id];
		}
	};
}

function yCombinator(func){
	return (function(x){
		return func(function (y) { return (x(x))(y);});
	})(function (x){
		return func(function (y) { return (x(x))(y);});
	});
};


//============================================================================================
//	*String
function repeat(str,count,clip)
{
	clip=clip||0;
	var r=[], size=-1;
	while(++size<count)
		r.push(str);
	r=r.join('');
	if(clip>0 && r.length>clip)
		return r.substr(0,clip);
	return r;
}
function ljust(str,size,pattern)
{
	pattern=pattern||' ';
	var padding=size-str.length;
	return str+repeat(pattern,padding/pattern.length,padding);
}
function rjust(str,size,pattern)
{
	pattern=pattern||' ';
	var padding=size-str.length;
	return repeat(pattern,padding/pattern.length,padding)+str;
}
function center(str,size,pattern,noReverse)
{
	pattern=pattern||' ';
	var padding=(size-str.length);
	var rpad=(padding/2)|0, lpad=rpad;
	if(rpad!==padding/2) ++rpad;
	return repeat(pattern,Math.ceil(rpad/pattern.length),rpad)+str+repeat(noReverse?pattern:reverse(pattern),Math.ceil(lpad/pattern.length),lpad);
}
function trim(str)
{
	var start=0, end=str.length-1;
	var c;
	while((c=str.charCodeAt(start))!==-1 && ((c>=8 && c<=13) || c===32))
		start++;
	while((c=str.charCodeAt(end))!==-1 && ((c>=8 && c<=13) || c===32))
		end--;
	++end;
	if(start>=end) return "";
	return str.substring(start,end);
}

//============================================================================================
//	*Array
function slice(array,start,size)
{
	var len=array.length;
	start=start||0;
	size=size||(len-start);
	if(size<=0) return [];
	if(size>len-start)
		size=len-start;
	var end=start+size;
	var index=start-1;
	var r=[];
	while(++index<end)
		r.push(array[index]);
	return r;
}
function range(n,f)
{
	f=f||valueFunction(0);
	var r=[];
	var index=-1;
	while(++index<n)
		r.push(f(index));
	return r;
}
function unique(array)
{
	var found={}, r=[], index=-1, len=array.length;
	while(++index<len)
	{
		var val=array[index];
		if(found.hasOwnProperty(val))
			continue;
		found[val]=null;
		r.push(val);
	}
	return r;
}
function first(array,test)
{
	self=self||null;
	test=test||1;
	var index=-1, len=array.length;
	var size;
	if(typeof(test)==='number')
	{
		if(test===1) return array[0];
		size=test;
	}
	else
	{
		size=0;
		while(++index<len && test(array[index],index)===true)
			++size;
	}
	return slice(array,0,size);
}
function last(array,test)
{
	self=self||null;
	test=test||1;
	var r=[], index=array.length, end=array.length-test-1;
	if(typeof(test)==='number')
	{
		if(test===1) return array[array.length-1];
		while(--index>end)
			r.unshift(array[index]);
		return r;
	}
	while(--index>-1)
	{
		if(test(array[index],index)===false)
			break;
		r.unshift(array[index]);
	}
	return r;
}
function indexOf(array,test,from)
{
	if(typeof(test)!=='function')
	{
		var value=test;
		test=function(elem){return elem===value};
	}
	
	from=from||0;
	var len=array.length;
	while(from<0)
		from=len+from;
	var index=from-1;
	while(++index<len)
		if(test(array[index])===true)
			return index;
	return -1;
}
function lastIndexOf(array,test,from)
{
	if(typeof(test)!=='function')
	{
		var value=test;
		test=function(elem){return elem===value};
	}
	
	from=from||0;
	var len=array.length;
	while(from<0)
		from=len+from;
	var index=len-from;
	while(--index>0)
		if(test(array[index])===true)
			return index;
	return -1;
}
function flatten(array,getter,shallow)
{
	getter=makeGetter(getter);
	
	var r=[];
	var index=-1;
	var len=array.length;
	
	if(shallow!==false)
	{
		var index2, len2;
		while(++index<len)
		{
			var value=getter(array[index]);
			if(hasOwn(value,'length') && typeof(value.length)==='number')
				each(value,function(item){r.push(item)});
			else
				r.push(value);
		}
		return r;
	}
	var stack=[];
	while(++index<len)
	{
		var value=getter(array[index]);
		if(typeof(value)==='object' && typeof(value.length)==='number')
		{
			stack.push({array:array,index:index});
			index=-1;
			array=value;
			len=array.length;
			continue;
		}
		r.push(value);
		while(index===len-1 && stack.length>0)
		{
			var next=stack.pop();
			array=next.array;
			len=array.length;
			index=next.index;
		}
	}
	return r;
}

//============================================================================================
//	*Object
function hasOwn(obj,prop)
{
	return obj.hasOwnProperty(prop);
}
function pairs(object)
{
	return map(object,function(value,key){return [key,value]});
}
function pick(object,keys)
{
	if(typeof(keys)!=='function')
	{
		var k=keys;
		keys=function(key){return indexOf(k,key)!==-1};
	}
	var r={};
	each(object,function(value,key){
		if(keys(key)===true)
			r[key]=value;
	});
	return r;
}
function assign(base)
{
	each(arguments,function(obj){
		each(obj,function(value,key){
			base[key]=value;
		});
	},1);
	return base;
}
function invert(obj)
{
	var r={};
	each(obj,function(value,key){
		r[value]=key;
	});
	return r;
}
function defaults(base)
{
	each(arguments,function(obj){
		each(obj,function(value,key){
			if(!hasOwn(
			base[key]=value;
		});
	},1);
	return base;
}

//============================================================================================
//	*String/Array
function reverse(obj)
{
	if(typeof(obj)==='string')
		return obj.split('').reverse().join('');
	return obj.reverse();
}
function concat()
{
	if(typeof(arguments[0])==='string')
	{
		var r=arguments[0], i=0, e=arguments.length;
		while(++i<e)
			r+=arguments[i];
		return r;
	}
	var r=[];
	var count=-1, end=arguments.length;
	while(++count<end)
	{
		var array=arguments[count];
		var index=-1, len=array.length;
		while(++index<len)
			r.push(array[index]);
	}
	return r;
}

//============================================================================================
//	*Iterable
function each(iterable,f,index)
{
	if(hasOwn(iterable,'length') && typeof(iterable.length)==='number')
	{
		index=(index||0)-1;
		var len=iterable.length;
		while(++index<len)
			if(f(iterable[index],index,iterable)===false)
				break;
	}
	else
	{
		var keys=Object.keys(iterable);
		index=-1;
		var len=keys.length;
		while(++index<len)
			if(f(iterable[keys[index]],keys[index],iterable)===false)
				break;
	}
}
function eachRight(iterable,f,offset)
{
	if(hasOwn(iterable,'length') && typeof(iterable.length)==='number')
	{
		if(typeof(offset)==='number' && offset!==0)
			offset=iterable.length-offset;
		else
			offset=iterable.length;
		while(--offset>=0)
			if(f(iterable[offset],offset,iterable)===false)
				break;
	}
	else
	{
		var keys=Object.keys(iterable);
		if(typeof(offset)==='number' && offset!==0)
			offset=keys.length-offset;
		else
			offset=keys.length;
		while(--offset>=0)
			if(f(iterable[keys[offset]],keys[offset],iterable)===false)
				break;
	}
}
function where(iterable,test)
{
	if(typeof(test)==='string')
		test=new Function('item','return '+test);
	
	var r=[];
	if(hasOwn(iterable,'length') && typeof(iterable.length)==='number')
	{
		var index=-1, len=iterable.length;
		while(++index<len)
			if(test(iterable[index],index)===true)
				r.push(iterable[index]);
	}
	else
	{
		Object.keys(iterable).foreach(function(key){
			if(test(iterable[key],key)===true)
				r.push(iterable[key]);
		});
	}
	return r;
}
function find(iterable,test)
{
	if(typeof(test)!=='function')
	{
		var value=test;
		test=function(elem){return elem===value};
	}
	if(hasOwn(iterable,'length') && typeof(iterable.length)==='number')
	{
		var index=indexOf(array,test);
		if(index===-1)
			return;
		return iterable[index];
	}
	var keys=Object.keys(iterable);
	var i=indexOf(keys,function(key){return test(iterable[key])});
	if(i===-1)
		return;
	return iterable[keys[i]];
}
function reduce(obj,accum,base)
{
	base=(base===undefined)?0:base;
	var pre;
	each(obj,function(value,key){
		pre=base;
		base=accum(base,value,key);
		if(base===_undefined) base=pre;
	});
	return base;
}
function reduceRight(obj,accum,base)
{
	base=base||0;
	var pre;
	eachRight(obj,function(value,key){
		pre=base;
		base=accum(base,value,key);
		if(base===_undefined) base=pre;
	});
	return base;
}
function indexBy(obj,keyf)
{
	keyf=makeGetter(keyf);
	var r={};
	each(obj,function(value){
		r[keyf(value)]=value;
	});
	return r;
}
function group(obj,keyf)
{
	keyf=makeGetter(keyf);
	var r={};
	each(obj,function(value){
		var key=keyf(value);
		if(!hasOwn(r,key))
			r[key]=[];
		r[key].push(value);
	});
	return r;
}
function count(obj,keyf)
{
	keyf=makeGetter(keyf);
	var r={};
	each(obj,function(value){
		var key=keyf(value);
		if(!hasOwn(r,key))
			r[key]=0;
		++r[key];
	});
	return r;
}
function map(iterable,f)
{
	var r=[];
	each(iterable,function(value,key){
		r.push(f(value,key));
	});
	return r;
}
function pluck(iterable,prop)
{
	return map(iterable,function(item){return item[prop]});
}

//============================================================================================
//	*Function
function curryHelper(f,args,arity)
{
	return function(){
		args=concat(args,arguments);
		if((f.length>0 && args.length>=f.length) || args.length>arity)
			return f.apply(null,args,arity);
		return curryHelper(f,args);
	};
}
function curry(f,arity)
{
	return curryHelper(f,[],arity||Math.Infinity);
}
function delay(f,time)
{
	var args=slice(arguments,2);
	return setTimeout(function(){f.apply(null,args)},time);
}
function compose()
{
	var funcs=slice(arguments);
	return function(){
		var args=slice(arguments);
		var result=last(funcs).apply(null,args);
		eachRight(funcs,function(next){
			result=next(result);
		},1);
		return result;
	};
}
function debounce(f,time)
{
	var last=now();
	return function(){
		var t=now();
		if(last-t>=time)
		{
			last=t;
			f.apply(null,slice(arguments));
		}
	};
}

//============================================================================================
//	*Helpers
function makeGetter(value)
{
	var type=typeof(value);
	if(type==='function') return;
	if(type==='string')
		return function(item){return item[value]};
	return function(item){return item};
}
function now()
{
	return Date.now();
}


fc.log=log;
fc.error=error;
fc.rethrow=function(err){throw err};

//	String
fc.repeat=repeat;
fc.ljust=ljust;
fc.rjust=rjust;
fc.center=center;
fc.trim=trim;

//	Array
fc.slice=slice;
fc.range=range;
fc.unique=unique;
fc.frist=first;
fc.last=last;
fc.indexOf=indexOf;
fc.lastIndexOf=lastIndexOf;
fc.flatten=flatten;

//	Objects
fc.hasOwn=hasOwn;
fc.pairs=pairs;
fc.pick=pick;
fc.assign=assign;
fc.invert=invert;

//	String/Array
fc.reverse=reverse;
fc.concat=concat;

//	Iterable
fc.each=each;
fc.eachRight=eachRight;
fc.where=where;
fc.find=find;
fc.reduce=reduce;
fc.reduceRight=reduceRight;
fc.indexBy=indexBy;
fc.group=group;
fc.count=count;
fc.map=map;
fc.pluck=pluck;

//	Function
fc.curry=curry;
fc.delay=delay;
fc.compose=compose;
fc.debounce=debounce;
fc.yCombinator=yCombinator;


function addProperty(obj,name,prop)
{
	return Object.defineProperty(obj,name,prop);
}
function promiseCallback(f,p)
{
	return function(value){
		try{
			var r=f(value);
			if(r && typeof(r.then)==='function')
				r.then(
					function(s){p.resolve(s)},
					function(e){p.reject(e)}
				);
			else
				p.resolve(r);
		}
		catch(error){
			p.reject(error);
		}
	};
}

function promise(f)
{
	f=f||null;
	var self={};
	
	var success=[];
	var failure=[];
	var state="pending";
	var value;
	
	function resolve(val)
	{
		if(state!=="pending")
			throw new Error("Cannot call resolve on non-pending promise");
		state="resolved";
		value=val;
		success.forEach(function(cb){
			setImmediate(cb,value);
		});
		success=failure=null;
	}
	function reject(err)
	{
		if(state!=="pending")
			throw new Error("Cannot call reject on non-pending promise");
		state="rejected";
		value=err;
		failure.forEach(function(cb){
			setImmediate(cb,value);
		});
		success=failure=null;
	}
	
	addProperty(self,'state',{get:function(){return state}});
	self.then=function(g,b){
		var next=promise();
		g=g||null;
		b=b||null;
		if(state==="pending")
		{
			if(g!==null)
				success.push(promiseCallback(g,next));
			if(b!==null)
				failure.push(promiseCallback(b,next));
		}
		if(state==="resolved" && g!==null)
			promiseCallback(g,next)(value);
		if(state==="rejected" && b!==null)
			promiseCallback(b,next)(value);
		
		return next;
	}
	self.resolve=resolve;
	self.reject=reject;
	if(f!==null)
		f(resolve,reject);
	return self;
}

promise.all=function(){
	var args=slice(arguments), left=args.length;
	var allP=promise();
	
	function done(i)
	{
		return function(value){
			--left;
			args[i]=value;
			if(left===0)
				allP.resolve(args);
		};
	}
	
	for(var x=0;x<left;++x)
		args[i].then(done(i));
	
	return allP;
}
promise.race=function(){
	var count=arguments.length;
	var resolved=false;
	
	var first=promise();
	function done(value)
	{
		if(resolved) return;
		resolved=true;
		first.resolve(value);
	}
	for(var x=0;x<count;++x)
		arguments[x].then(done);
	
	return first;
};
fc.promise=promise;


function hex_encode(str)
{
	var r=[];
	for(var x=0;x<str.length;++x)
		r.push(('0'+str.charCodeAt(x).toString(16)).slice(-2));
	return r.join('');
}

var base64_chars=[
	"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
	"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
	'0','1','2','3','4','5','6','7','8','9',"+","/"
];
var base64_values=fc.invert(base64_chars);

var byteMask=0x7F;
var cutoffs=[
	0x7F,
	0x7FF,
	0xFFFF,
	0x1FFFFF
];
var firstByteHead=[
	parseInt("11000000",2),
	parseInt("11100000",2),
	parseInt("11110000",2)
];
var firstByteMask=[
	parseInt("00011111",2),
	parseInt("00001111",2),
	parseInt("00000111",2)
];
var extraByteHead=parseInt("10000000",2);
var extraByteMask=parseInt("00111111",2);
function utf8Bytes(str)
{
	var bytes=[];
	var x=-1, len=str.length;
	while(++x<len)
	{
		var c=str.charCodeAt(x);
		if(c<=cutoffs[0])
			bytes.push(c);
		else if(c<=cutoffs[1])
		{
			bytes.push(((c>>6)&firstByteMask[0])|firstByteHead[0]);
			bytes.push((c&extraByteMask)|extraByteHead);
		}
		else if(c<=cutoffs[2])
		{
			bytes.push(((c>>12)&firstByteMask[0])|firstByteHead[0]);
			bytes.push(((c>>6)&extraByteMask)|extraByteHead);
			bytes.push((c&extraByteMask)|extraByteHead);
		}
		else
		{
			bytes.push(((c>>18)&firstByteMask[0])|firstByteHead[0]);
			bytes.push(((c>>12)&extraByteMask)|extraByteHead);
			bytes.push(((c>>6)&extraByteMask)|extraByteHead);
			bytes.push((c&extraByteMask)|extraByteHead);
		}
	}
	return bytes;
}
function fromUTF8(bytes)
{
	var index=-1, len=bytes.length;
	var r=[];
	
	while(++index<len)
	{
		var b=bytes[index];
		if(b<128)
		{
			r.push(String.fromCharCode(bytes[index]));
			continue;
		}
		if((b&firstByteHead[0])===firstByteHead[0])
		{
			r.push(String.fromCharCode(
				((b&firstByteMask[0])<<6)|
				(bytes[index+1]&extraByteMask)
			));
			++index;
			continue;
		}
		if((b&firstByteHead[1])===firstByteHead[1])
		{
			r.push(String.fromCharCode(
				((b&firstByteMask[0])<<12)|
				((bytes[index+1]&extraByteMask)<<6)|
				(bytes[index+2]&extraByteMask)
			));
			index+=2;
		}
	}
	
	return r.join('');
}

var base64Mask=parseInt("00111111",2);
var reverseLookup=[
	0x0,0x8,0x4,0xC,
	0x2,0xA,0x6,0xE,
	0x1,0x9,0x5,0xD,
	0x3,0xB,0x7,0xF
];
function reverseByte(b)
{
	return (reverseLookup[b&0xF]<<4)|reverseLookup[b>>4];
}
function base64_encode(array)
{
	if(typeof(array)==='string')
		array=utf8Bytes(array);
	var r=[];
	var size=array.length;
	var byteCount=0;
	var bytes=0;
	fc.each(array,function(b){
		bytes=bytes|(reverseByte(b)<<byteCount);
		byteCount+=8;
		while(byteCount>=6)
		{
			r.push(base64_chars[reverseByte((bytes&0x3F)<<2)]);
			bytes>>=6;
			byteCount-=6;
		}
	});
	if(byteCount>0)
		r.push(base64_chars[reverseByte((bytes&0x3F)<<2)]);
	if(byteCount===2)
		r.push('==');
	if(byteCount===4)
		r.push('=');
	return r.join('');
}

fc.encode={
	base64:base64_encode
};
fc.decode={
	base64:base64_encode
};

var formats={
	number:function(value,size){
		if(size) return rjust(value+"",+size);
		return value+"";
	},
	exp:function(value,size){
		value=(+value).toExponential();
		if(size) return rjust(value,+size);
		return value;
	},
	EXP:function(value,size){
		value=(+value).toExponential().toUpperCase();
		if(size) return rjust(value,+size);
		return value;
	},
	hex:function(value,size){
		value=value.toString(16);
		if(size) return rjust(value,+size);
		return value;
	},
	HEX:function(value,size){
		value=value.toString(16).toUpperCase();
		if(size) return rjust(value,+size);
		return value;
	},
	base64:function(value){
		return base64_encode(value);
	},
	binary:function(value,size){
		value=value.toString(2);
		if(size) return rjust(value,+size);
		return value;
	},
	string:function(value,f,space,pattern){
		value+="";
		if(!f) return value;
		return factotum[f](value,+space,pattern);
	},
	json:function(value){
		return JSON.stringify(value);
	},
	url:function(value){
		return encodeURIComponent(value+"");
	},
	call:function(value,func){
		log(slice(arguments,2));
		return value[func].apply(value,slice(arguments,2));
	}
};
function sprintf(str)
{
	var args=slice(arguments,1);
	return str.replace(/\%\%|\%\{[^\}]+\}/g,function(s){
		if(s==="%%") return "%";
		
		var form=s.substr(2,s.length-3).split('/');
		var prop=form[0].split(".");
		var value=args;
		for(var x=0;x<prop.length;x++)
			value=value[prop[x]];
		if(form.length>1)
		{
			var fargs=form[1].split(' ');
			var fmat=fargs.shift();
			return formats[fmat].apply(null,concat([value],fargs));
		}
		return value;
	});
}
sprintf.addFormat=function(name,func){
	formats[name]=func;
};
fc.sprintf=sprintf;


function ajax(options,callback)
{
	var request=new XMLHttpRequest();
	var p=promise();
	
	var url=options.url;
	var async=hasOwn(options,'async')?options.async:true;
	var postData=hasOwn(optoins,'post')?options.post:null;
	
	request.addEventListener('load',function(event){
		var result={requestObject:request};
		result.statusCode=request.status;
		result.statusText=request.statusText;
		result.text=request.responseText;
		result.success=(request.status>=200 && request.status<300);
		if(callback) setImmediate(bind(callback,null,result));
		if(result.success)
			p.resolve(result);
		else
		{
			var error=new Error(sprintf("Error code %{0} returned by server",result.statusCode));
			error.result=result;
			error.name="BadRequest";
			p.reject(error);
		}
	});
	var method=(postData!==null)?"POST":"GET";
	try{
		request.open(method,url,async!==false);
		request.setRequestHeader("Content-Type","application/json");
		request.send(postData);
	}
	catch(err){
		p.reject(err);
	}
	return p;
}
fc.ajax=ajax;

function compileTemplate(template,settings,data)
{
	"use strict";
	settings=assign({},compileTemplate.settings,settings||{});
	var before_template="\");\n";
	var after_template="r.push(\"";
	template="r.push($3"+template+"$3);";
	var code=template.
		replace(/\\n/g,"$2").replace(/\r?\n/g,"$1").replace(/\"/g,"\\\"").
		replace(/\{\%\s*for ([\w\$][\w\d\$]*) (\d+)\-\>(\d+)\s*\%\}/g,function(loop,name,start,end){
			return before_template+
					sprintf("var %{2}=%{0};\nwhile(++%{2}<%{1}){\n",(+start)-1,end,name)+
					after_template;
		}).
		replace(/\{\%\s*if (.+?)\s*\%\}/g,function(s,condition){
			return before_template+
					sprintf("if(%{0}){\n",condition)+
					after_template;
		}).
		replace(/\{\%\s*else\s*\%\}/g,function(s){
			return before_template+
					"else{\n"+
					after_template;
		}).
		replace(/\{\%\s*elseif (.+?)\s*\%\}/g,function(s,condition){
			return before_template+
					sprintf("else if(%{0}){\n",condition)+
					after_template;
		}).
		replace(/\{\%\s*for (\w[\w\d]*)\s+in\s+([\w\$][\w\d\$\.]*)\s*\%\}/g,function(s,variable,array){
			return before_template+
					sprintf("var $index=-1, $end=%{0}.length;\nwhile(++$index<$end){\nvar %{1}=%{0}[$index];\n",array,variable)+
					after_template;
		}).
		replace(/\{\%\s*for (\w[\w\d]*)?:(\w[\w\d]*) in ([\w\$][\w\d\$\.]*)\s*\%\}/g,function(s,keyName,valueName,obj){
			return before_template+
					sprintf("for(var %{0} in %{2}){\nif(!%{2}.hasOwnProperty(%{0})) continue;\nvar %{1}=%{2}[%{0}];\n",keyName||"key_"+valueName,valueName,obj)+
					after_template;
		}).
		replace(/\{\%:\s*(.*?)\s*\%\}/g,function(s,code){
			return before_template+"r.push("+code.replace(/\\\"/g,'"')+");\n"+after_template;
		}).
		replace(/\{\%\s*\/(for|if)\s*\%\}/g,before_template+"}\n"+after_template).
		replace(/\{\%\@(\s|\$1)+(.*?)\s*\%\}/gm,function(s,space,code){
			return before_template+code.replace(/\\\"/g,'"')+"\n"+after_template;
		}).
		replace(/\{\%\%/g,"{%").replace(/\%\%\}/g,"%}").
		replace(/\$3/g,'"').
		replace(/r\.push\(""\);\n?/g,"").
		replace(/r\.push\("(.+?[^\\])?"\)/g,function(s){
			return s.replace(/\$1/g,"\\n");
		}).
		replace(/\$2/g,"\\n").replace(/\$1/g,"\n");
	var argNames=settings.args||[];
	var vars=[];
	for(var x=0;x<argNames.length;++x)
		vars.push(argNames[x]+"="+settings.dataName+"['"+argNames[x]+"'];");
	code="function print(){var index=-1, len=arguments.length; while(++index<len){r.push(arguments[index]);}}\nvar echo=print, \
puts=print, cout=print;\nvar r=[];\n"+vars.join("")+"\n"+code+"\nreturn r.join('');";
	try{
		var f=new Function(concat([settings.dataName],argNames),code);
	}
	catch(e){
		var depth=1;
		code=map(code.split('\n'),function(line){
			if(last(line)==="}" && depth>1)
				depth--;
			line=repeat('\t',depth)+trim(line);
			if(last(line)==="{")
				depth++;
			return line;
		}).join('\n');
		//log(code);/**/
		log("error compiling:",code);
		return null;
	}
	f.source=code;
	return data?f(data):f;
}
compileTemplate.settings={
	dataName:"$data"
};

fc.template=compileTemplate;


fc=Object.freeze(fc);

if(typeof(exports)!=='undefined')
	exports=fc;
else if(typeof(module)!=="undefined")
	module.exports=fc;
else
	window.fc=fc;

})();
