const
    http = require('http'),
    express = require('express'),
    _ = require('../../src/util'),
    { Literal, Resource, Identifier } = require('../../src/metamodel'),
    { Policy, Rule, Permission, Action, Asset, AssetCollection, Party } = require('../../src/model'),
    { RequestPolicy } = require('../../src/extension'),
    { prohibit, perm } = require('../../src/individuals');

let nextPort = 8080;
function testRequest(callback, options = {}) {
    const
        app = express(),
        server = http.createServer(app),
        port = nextPort++,
        waiter = new Promise((resolve, reject) => {
            app.use(async (request, response, next) => {
                try {
                    await callback(request, response, next);
                    resolve();
                } catch (err) {
                    reject(err);
                }
                response.end();
                server.close();
            });
        });

    server.listen(port, () => {
        http.request({ port, host: 'localhost', ...options }).end();
    });

    return waiter;
}

describe('test: model.RequestPolicy', function () {

    beforeAll(() => _.audit('test: model.RequestPolicy'));

    test('should instanciate', () => testRequest(
        async (request, response, next) => {
            const reqPolicy = new RequestPolicy(request);
            expect(reqPolicy.target).toBeInstanceOf(Asset);
        }
    ));

    test('should inherit from another policy', () => testRequest(
        async (request, response, next) => {
            const reqPolicy = new RequestPolicy(request);
            const odrl_use = new Action({ uid: 'odrl:use' }, (ctx) => {
                debugger;
            });
            const ex_assets = new AssetCollection({
                uid: 'ex:assets'
            });
            const use_permission = new Permission({
                action: odrl_use,
                target: ex_assets
            });
            const ex_policy = new Policy({
                uid: 'ex:policy',
                conflict: perm,
                permission: [use_permission]
            });
            reqPolicy.target.partOf.add(ex_assets);
            reqPolicy.inheritFrom.add(ex_policy);
            expect(reqPolicy.inheritFrom.has(ex_policy.uid)).toBeTruthy();
        }
    ));

});