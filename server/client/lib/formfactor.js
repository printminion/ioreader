(function() {
  // Some Paul Irish magic
  if (!window.matchMedia){
    window.matchMedia = (function(doc, undefined){
      var bool,
          docElem = doc.documentElement,
          fakeBody = doc.createElement('body'),
          testDiv = doc.createElement('div');
                                       
       testDiv.setAttribute('id','ejs-qtest');
       fakeBody.appendChild(testDiv);
                                              
       return function(q){
         var styleBlock = doc.createElement('style'),
             cssrule = '@media '+q+' { #ejs-qtest { position: absolute; } }';
                                                                           
         styleBlock.type = "text/css"; //must set type for IE! 
         if (styleBlock.styleSheet){ 
           styleBlock.styleSheet.cssText = cssrule;
         } 
         else {
           styleBlock.appendChild(doc.createTextNode(cssrule));
         } 
         docElem.insertBefore(fakeBody, docElem.firstChild);
         docElem.insertBefore(styleBlock, docElem.firstChild);
         bool = ((window.getComputedStyle ? window.getComputedStyle(testDiv,null) : testDiv.currentStyle)['position'] == 'absolute');
         docElem.removeChild(fakeBody);
         docElem.removeChild(styleBlock);
                                                                                               
         return { matches: bool, media: q };
       };
    })(document);
  }

  var nameEQ = "__formfactorJSOverride=";
  var resourceDefaults = {
    excss: {
      tag: "link",
      rel: "stylesheet",
      urlKind: "href",
      type: "text/excss"
    },
    less: {
      tag: "link",
      rel: "stylesheet/less",
      urlKind: "href",
      type: "text/css"
    },
    css: {
      tag: "link",
      rel: "stylesheet",
      urlKind: "href",
      type: "text/css"
    },
    js: {
      tag: "script",
      urlKind: "src",
      type: "text/javascript"
    },
    coffee: {
      tag: "script",
      urlKind: "src",
      type: "text/coffescript"
    }
  }

  var testMedia = function(query) {
    var mql = matchMedia(query);
    return mql.matches;
  };

  var indicates = function(indicator) {
    return (typeof(indicator) == "function" && indicator()) 
        || (typeof(indicator) == "boolean" && indicator)
        || (typeof(indicator) == "string" && testMedia(indicator))
  };

  // A collection of the formfactors and tests.
  var formfactorIndicators = {};

  var isFormfactor = function(formfactor) {
    var indicators = formfactorIndicators[formfactor];
    var indicator;
    for(var i = 0; indicator = indicators[i]; i++) {
      if (indicates(indicator)) return true;
    }

    return false;
  };

  var createTag = function(href, tagName, rel, urlKind, type) {
    var extension = href.substring(href.lastIndexOf(".") + 1); 
    var resourceType = resourceDefaults[extension] || { type: type, rel: rel, urlKind: urlKind  };
    var tag = document.createElement(resourceType.tag || tagName);
    
    if(resourceType.rel) tag.rel = resourceType.rel; 
    if(resourceType.type) tag.type = resourceType.type;
    tag[resourceType.urlKind] = href;

    return tag;
  };

  var initializeFormfactor = function(action) {
    action.callbacks = action.callbacks || function() {};
    action.resources = action.resources || [];

    if(typeof(action.resources) === "string") {
      document.head.appendChild(createTag(action.resources)); 
    }
    else if(action.resources instanceof Array) {
      var resource;
      for(var resource_idx = 0; resource = action.resources[resource_idx]; resource_idx++ ) {
        if(typeof(resource) === "string") {
          document.head.appendChild(createTag(resource)); 
        }
        else {
          document.head.appendChild(createTag(resource.href, resource.tag, resource.rel, resource.urlKind, resource.type));
        }
      }
    }
   
    if(typeof(action.callbacks) === "function") {
      action.callbacks(action.formfactor);
    }
    else if (action.callbacks instanceof Array) {
      var callback;
      for(var cb_idx = 0; callback = action.callbacks; cb_idx++) {
        callback(action.formfactor);
      }
    }

    if(document.querySelector) {
      var html = document.querySelector("html");
      html.classList.add(action.formfactor);
    }

  };

  var is = function(type) {
    var opts = {};
    opts[type]={};
    return (detect(opts) == type);
  };

  var isnt = function(type) {
    return !(is(type));
  };

  var getOverrideCookie = function() {
    // Based on the work of ppk
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  };

  var setOverrideCookie = function(formfactorName) {
    document.cookie = nameEQ + formfactorName;
  };

  var detect = function(formfactorActions, defaultFormfactorAction, callback) {
    defaultFormfactorAction = defaultFormfactorAction || { "resources": [], "callbacks": function() {} };
    callback = callback || function() {};
    
    var formfactorAction;
    var formfactorOverride = getOverrideCookie();
    if(!!formfactorOverride == false) {
      for(var i = 0; formfactorAction = formfactorActions[i]; i++) {
        if(isFormfactor(formfactorAction.formfactor)) {
          initializeFormfactor(formfactorAction);
          callback(formfactorAction.formfactor);
          return formfactorAction.formfactor;
        }
      };
    }
    else {
      for(var i = 0; formfactorAction = formfactorActions[i]; i++) {
        if(formfactorAction.formfactor == formfactorOverride) {
          initializeFormfactor(formfactorAction);
          callback(formfactorAction.formfactor);
          return formfactorAction.formfactor;
        }
      }
    }

    initializeFormfactor(defaultFormfactorAction);
    callback();
    return;
  };

  var register = function(formfactor) {
    for(var form in formfactor) {
      formfactorIndicators[form] = formfactor[form]; 
    }
  };

  var factors = function() {
    var formfactors = [];
    for(var i = 0; formfactorAction = formfactorActions[i]; i++) {
      formfactors.pushr(formfactorAction.formfactor);
    }
    return formfactors;
  };

  var override = function(formfactor) {
    if(formfactorIndicators[formfactor]) throw "Unknown Formfactor";
    setOverrideCookie(formfactor) 
  };
  
  window.formfactor = {
    "register": register,
    "detect": detect,
    "factors" : factors,
    "override" : override,
    "is": is,
    "isnt": isnt
  };
})();
