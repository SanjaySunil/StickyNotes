/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["README.md", "f823db5564c8aa3847a09e43e484721a"], ["browserconfig.xml", "7333a37b7d5ede79960f0740ba3e6e86"], ["css/style.css", "c30e9644214a626d548010cb0866dbce"], ["favicons/android-chrome-192x192.png", "f92b28d5904f30b4dd270e39e4fe6cb8"], ["favicons/android-chrome-384x384.png", "e4cc4ffac78e1ab11cca9c26c6208b69"], ["favicons/apple-touch-icon.png", "2467db58fb26cc1731eecde24e6d12c5"], ["favicons/favicon-16x16.png", "a0362680e4a7137a00e6ccb00415290c"], ["favicons/favicon-32x32.png", "6d7530bd6829c17a4b4b9720c39121a1"], ["favicons/favicon.ico", "2b3cacb06a71a44fa42e6892affb3938"], ["favicons/mstile-150x150.png", "63bd9a48a62621531708f761c9eb8247"], ["favicons/safari-pinned-tab.svg", "a93390a42f12fc18d8e81c3fe19f9014"], ["img/logo.png", "e644f50ed221084b800a3945ba80e6c6"], ["img/previews/preview.png", "2b7034d9557a538b69f30174282c3029"], ["index.html", "1ceb02b53225f240ad73f74672ddd509"], ["js/index.js", "20b3bbfe4d26eea72eca079c25203c57"], ["lib/noty/bootstrap-v4.css", "79bdd08dc01eda3f90aa81d1ea31b42d"], ["lib/noty/nest.css", "434f0ef9715a65951675897ad47997b8"], ["lib/noty/noty.css", "689ad4617057f2b018e424778512f494"], ["lib/noty/noty.js", "2296240b3842cbb3410c2104925f0db4"], ["site.webmanifest", "76d36e13fd8134c0a2dfc88b656aa46f"]];
var cacheName = 'sw-precache-v3-sw-precache-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
  var url = new URL(originalUrl);
  if (url.pathname.slice(-1) === '/') {
    url.pathname += index;
  }
  return url.toString();
};

var cleanResponse = function (originalResponse) {
  // If this is not a redirected response, then we don't have to do anything.
  if (!originalResponse.redirected) {
    return Promise.resolve(originalResponse);
  }

  // Firefox 50 and below doesn't support the Response.body stream, so we may
  // need to read the entire body to memory as a Blob.
  var bodyPromise = 'body' in originalResponse ?
    Promise.resolve(originalResponse.body) :
    originalResponse.blob();

  return bodyPromise.then(function (body) {
    // new Response() is happy when passed either a stream or a Blob.
    return new Response(body, {
      headers: originalResponse.headers,
      status: originalResponse.status,
      statusText: originalResponse.statusText
    });
  });
};

var createCacheKey = function (originalUrl, paramName, paramValue,
  dontCacheBustUrlsMatching) {
  // Create a new URL object to avoid modifying originalUrl.
  var url = new URL(originalUrl);

  // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
  // then add in the extra cache-busting URL parameter.
  if (!dontCacheBustUrlsMatching ||
    !(url.pathname.match(dontCacheBustUrlsMatching))) {
    url.search += (url.search ? '&' : '') +
      encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
  }

  return url.toString();
};

var isPathWhitelisted = function (whitelist, absoluteUrlString) {
  // If the whitelist is empty, then consider all URLs to be whitelisted.
  if (whitelist.length === 0) {
    return true;
  }

  // Otherwise compare each path regex to the path of the URL passed in.
  var path = (new URL(absoluteUrlString)).pathname;
  return whitelist.some(function (whitelistedPathRegex) {
    return path.match(whitelistedPathRegex);
  });
};

var stripIgnoredUrlParameters = function (originalUrl,
  ignoreUrlParametersMatching) {
  var url = new URL(originalUrl);
  // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
  url.hash = '';

  url.search = url.search.slice(1) // Exclude initial '?'
    .split('&') // Split into an array of 'key=value' strings
    .map(function (kv) {
      return kv.split('='); // Split each 'key=value' string into a [key, value] array
    })
    .filter(function (kv) {
      return ignoreUrlParametersMatching.every(function (ignoredRegex) {
        return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
      });
    })
    .map(function (kv) {
      return kv.join('='); // Join each [key, value] array into a 'key=value' string
    })
    .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

  return url.toString();
};


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function (item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function (requests) {
    return requests.map(function (request) {
      return request.url;
    });
  }).then(function (urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return setOfCachedUrls(cache).then(function (cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function (cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, { credentials: 'same-origin' });
              return fetch(request).then(function (response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function (responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function () {

      // Force the SW to transition from installing -> active state
      return self.skipWaiting();

    })
  );
});

self.addEventListener('activate', function (event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.keys().then(function (existingRequests) {
        return Promise.all(
          existingRequests.map(function (existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function () {

      return self.clients.claim();

    })
  );
});


self.addEventListener('fetch', function (event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
      navigateFallback &&
      (event.request.mode === 'navigate') &&
      isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function (cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function (response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function (e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







