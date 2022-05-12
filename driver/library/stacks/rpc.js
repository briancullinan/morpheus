//


// TODO: rewrite in < 30 LoC

/*

var url = require('url')
var util = require('util')
var importer = require('../Core')
var {request} = importer.import('http request')

function getRpcFromSpec(spec, req, base) {
    if(req && req.request)
        req = req.request.bind(req)
    base = spec.baseUrl || base;
    var GoogleSpec = Object.keys(spec.resources || {}).reduce((obj, key) => {
        obj[key] = Object.keys(spec.resources[key].methods || {}).reduce((o, k) => {
            spec.resources[key].methods[k].parameters2 = spec.parameters
            o[k] = assignAndRequest.bind(spec,
                                         base,
                                         spec.resources[key].methods[k],
                                         req || request);
            return o;
        }, {})
        // combine parent parameters with child paramters
        Object.assign(obj[key], getRpcFromSpec(spec.resources[key], req, base))
        return obj;
    }, {})
    var version = ((spec.info || {}).version || '1').split('.')[0]
    // convert stupid OpenAPI to Google Discovery format
    var OpenAPI = Object.keys(spec.paths || {}).reduce((obj, key) => {
        var method = {
            path: '',
            parameters2: {}
        }
        var keys = key.replace(/^\/|\/$/ig, '').split('/')
            .reduce((keylist, k) => {
                if(k == 'json') {
                    method.parameters2['format'] = {
                        "enum": [
                            "json"
                        ],
                        "type": "string",
                        "enumDescriptions": [
                            "Responses with Content-Type of application/json"
                        ],
                        "location": "path",
                        "description": "Data format for response.",
                        "default": "json"
                    }
                    method.path += '/{format}'
                } else if (k == 'v' + version) {
                    method.parameters2['version'] = {
                        "enum": [
                            "json"
                        ],
                        "type": "string",
                        "location": "path",
                        "default": k
                    }
                    method.path += '/{version}'
                } else if (k == 'api' || k == '@' || k.length < 0) {
                    method.path += '/' + k
                } else {
                    keylist[keylist.length] = k
                    method.path += '/' + k
                }
                return keylist
            }, [])
        var currentPath = obj
        keys.forEach(k => {
            if(!currentPath[k]) currentPath[k] = {}
            currentPath = currentPath[k]
        })
        Object.keys(spec.paths[key]).forEach(k => {
            var parameters = (spec.paths[key][k].parameters || [])
                .reduce((o, p) => {
                    o[p.name] = {
                        location: p.in,
                        type: p.schema ? p.schema['$ref'] || p.schema.type || 'string' : 'string',
                        description: p.description,
                        required: p.required
                    }
                    return o
                }, {})
            var methodSpec = Object.assign({httpMethod: k.toUpperCase(), parameters: parameters}, method)
            var requestFunc = assignAndRequest.bind(spec,
                                                    spec.paths[key][k].servers[0].url,
                                                    methodSpec,
                                                    req || request);
            currentPath[k] = requestFunc
        })
        return obj
    }, GoogleSpec)
    return OpenAPI
}

function assignAndRequest(base, resource, request, input) {
    // TODO: get path parameters
    var path = getResourceParameters(resource, input, 'path')
    var address = `${base}${resource.path.replace(/\{(.*?)\}/ig, ($0, $1) => {
        if(!path[$1]) {
            throw new Error(`path parameter ${$1} not defined!`);
        }
        return path[$1];
    })}`;
    // TODO: move this to polyfills
    var location = url.parse(address)
    var params = Object.assign(
        getResourceParameters(resource, input, 'query'), 
        location.search
            ? querystring.parse((/\?(.*)/ig).exec(location.search)[1])
            : {});
    //console.log(`requesting ${address} ${JSON.stringify(params)}`);
    var data = getResourceParameters(resource, input, 'body')
    if(Object.values(data).length === 0) data = null
    var finalURL = address.replace(/\?.*$/ig, '') + '?' + querystring.stringify(params)
    console.log('Requesting: ' + finalURL)
    return request({
        method: resource.httpMethod,
        url: finalURL,
        data: data,
        body: JSON.stringify(input.resource),
        params: params
    })
    
}

function getResourceParameters(resource, input, type) {
    var paramters = {}
    Object.assign(paramters, resource.parameters2)
    Object.assign(paramters, resource.parameters)
    return Object.keys(paramters)
        .filter(k => paramters[k].location === type)
        .reduce((obj, key) => {
            if(paramters[key].required
               && (!input || typeof input[key] === 'undefined')) {
                throw new Error(`required field ${key} not defined!`);
            }
            if(typeof input[key] !== 'undefined')
                obj[key] = input[key];
            return obj;
        }, {})
}

module.exports = getRpcFromSpec;


*/



