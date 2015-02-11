import React from 'react';
import page from 'page';
import co from 'co';
import debug from 'debug';
import Dispatcher from './dispatcher';
import RouterStore from './stores/router-store';
import RouteTable from './stores/route-table';
import Navigate from './actions/navigate';
import SetComponents from './actions/set-components';
import {INIT_STORE} from './store-base';

import url from 'url';

import foreach from 'greasebox/dist/co-foreach';
import Tmpl from './tmpl';

debug.enable('app-driver');
const log = debug('app-driver');
debug.enable('route-log');
const routeLog = debug('route-log');
debug.enable('bind-log');
const bindLog = debug('bind-log');

const INIT = Symbol();



export default class ClientAppDriver {
  constructor (src, target, dataId) {
    let driver = this;
    driver.target = target;
    driver.appPath = src;
    log(src);

    let dispatcher = Dispatcher.getInstance();

    //find data
    let data;
    if(dataId) {
      let dataScript = document.querySelector(`script[id="${dataId}"]`);
      data = JSON.parse(dataScript.innerText);
      log(data);
    }
    co(function * () {
      var App = (yield System.import(src)).default;
      driver.app = App;
      log(App);


      //rehydrate stores
      var stores = [];
      for(let s of traceStores(App)) {
        let tmp = s.getInstance();
        tmp[INIT_STORE]();
        dispatcher.register(tmp);
        stores.push(tmp);
      }
      stores.forEach((s, i) => {
        s.rehydrate(data[i]);
      });

      //compose client routing logic and repopulate RouterStores's components list
      driver.srcRoot = RouteTable.getInstance().getSrcRoot();
      let routeTable = RouteTable.getInstance().getRoutes();

      driver.bindRoutes(routeTable, '/');
      page();


      //determine root component
      //render



    }).catch(log);
  }
  init() {
    this[INIT] = true;
    let RootComponent = RouterStore.getInstance().getRootComponent();
    React.render(<RootComponent />, document.querySelector(this.target));
  }
  bindRoutes(route, urlPath, parents = []) {
    bindLog('route: ', route, urlPath, parents);
    let driver = this;
    if(route.app) {
      if(route.hasComponent && !(route.routes && route.routes[urlPath])) {
        bindLog(`binding ${urlPath}`, route.app);
        page(urlPath, co.wrap(function * (ctx) {

          if(driver[INIT] && ctx.path === RouterStore.getInstance().getUrl()) {
            return;
          }
          routeLog('routed to: ', urlPath, route, parents);


          let compList = [];
          //check parents
          routeLog('check p: ', parents);
          yield foreach(parents, function * (p) {

            if(typeof p.app === 'string') {
              if(`${driver.srcRoot}/${p.app}`===driver.appPath) {
                p.app = driver.app;
              } else {
                let canonicalAppPath = url.resolve(driver.appPath, p.app);
                routeLog(`fetching ${canonicalAppPath}`);
                p.app = ( yield System.import(canonicalAppPath) ).default;
                routeLog(`successfully fetched: `, p.app);
              }
            }
            if(p.app.component) {
              compList.push(p.app.component);
            }
          });
          //check self
          if(typeof route.app === 'string') {
            if(`${driver.srcRoot}/${route.app}`===driver.appPath) {
              route.app = driver.app;
            } else {
              let canonicalAppPath = url.resolve(driver.appPath, route.app);
              routeLog(`fetching ${canonicalAppPath}`);
              route.app = ( yield System.import(canonicalAppPath) ).default;
              routeLog(`successfully fetched: `, route.app);
            }
          }
          if(route.app.component) {
            compList.push(route.app.component);
          }
          //module loaded

          //run navigate

          if(driver[INIT]) {
            //trigger navigate action
            yield new Navigate({
              params: ctx.params,
              title: Tmpl.format(route.title, ctx.params) || route.app.name || '',
              route: urlPath,
              url: ctx.path,
              components: compList
            }).exec();
          }

          //run actions
          yield foreach(parents, function * (p) {
            if(!p.app[INIT]) {
              if(driver[INIT]) {
                if(Array.isArray(p.app.initialActions)) {
                  yield foreach(p.app.initialActions, (initialAction) => {
                    return new initialAction.action(initialAction.payload).exec();
                  });

                }
              }
              p.app[INIT] = true;
            }
            log('driver[INIT]', driver[INIT]);
            if(driver[INIT]) {
              if(Array.isArray(p.app.routeActions)) {
                yield foreach(p.app.routeActions, (routeAction) => {
                  return new routeAction.action(routeAction.payload).exec();
                });
              }
            }

          });
          if(!route.app[INIT]) {
            if(driver[INIT]) {
              if(Array.isArray(route.app.initialActions)) {
                yield foreach(route.app.initialActions, (initialAction) => {
                  return new initialAction.action(initialAction.payload).exec();
                });

              }
            }
            route.app[INIT] = true;
            //run routeActions
          }
          if(driver[INIT]) {
            if(Array.isArray(route.app.routeActions)) {
              yield foreach(route.app.routeActions, (routeAction) => {
                return new routeAction.action(routeAction.payload).exec();
              });

            }
          }

          if (!driver[INIT]) {
            yield new SetComponents(compList).exec();
            driver.init();
          }

        }));
      }
      if(route.routes) {
        for(let p in route.routes) {
          this.bindRoutes(route.routes[p], p, parents.concat(route));
        }
      }
    } else {
      if(route.hasComponent) {
        bindLog(`binding ${urlPath}`, route);

        page(urlPath, co.wrap(function * (ctx) {
          if(driver[INIT] && ctx.path === RouterStore.getInstance().getUrl()) {
            return;
          }

          routeLog('routed to: ', urlPath, route, parents);
          let compList = [];
          //check parents
          yield foreach(parents, function * (p) {
            if(typeof p.app === 'string') {
              if(`${driver.srcRoot}/${p.app}`===driver.appPath) {
                p.app = driver.app;
              } else {
                let canonicalAppPath = url.resolve(driver.appPath, p.app);
                routeLog(`fetching ${canonicalAppPath}`);
                p.app = ( yield System.import(canonicalAppPath) ).default;
                routeLog(`successfully fetched: `, p.app);
              }
            }
            if(p.app.component) {
              compList.push(p.app.component);
            }

          });

          //navigate
          if(driver[INIT]) {
            //trigger navigate action
            yield new Navigate({
              params: ctx.params,
              title: Tmpl.format(route.title, ctx.params) || '',
              route: urlPath,
              url: ctx.path,
              components: compList
            }).exec();
          }

          //run actions
          yield foreach(parents, function * (p) {
            if(!p.app[INIT]) {
              if(driver[INIT]) {
                if(Array.isArray(p.app.initialActions)) {
                  yield foreach(p.app.initialActions, (initialAction) => {
                    return new initialAction.action(initialAction.payload).exec();
                  });

                }
              }
              p.app[INIT] = true;
            }
            if(driver[INIT]) {
              if(Array.isArray(p.app.routeActions)) {
                yield foreach(p.app.routeActions, (routeAction) => {
                  return new routeAction.action(routeAction.payload).exec();
                });
              }
            }

          });

          if(!driver[INIT]) {
            yield new SetComponents(compList).exec();
            driver.init();
          }

        }));
      }

    }
  }
}
function traceStores(App) {
  let res = new Set([RouterStore, RouteTable]);
  if(Array.isArray(App.stores)) {
    App.stores.forEach((s) => {
      res.add(s);
    });
  }
  return res;
}


