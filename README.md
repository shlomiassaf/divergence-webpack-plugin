# Divergence Webpack Plugin (DWP)

Create multiple variations of your application from one code base.  

## Background
A Web application might need to support multiple targets, the best example is a web application supporting both desktop & mobile where each has different views/behavior.

__DWP (Divergence Webpack Plugin)__ enables the creation of one or multiple variations of your application, loaded at runtime (Only 1 variation per runtime)  
DWP uses webpack's `require.ensure` to create Async chunks and provides an API & runtime logic to load the right module when required. 

This is best explained with a mobile/desktop application - at runtime detect the device being used and load the corresponding divergent chunk.
## Terminology     
  * `File`: Any webpack loadable content. HTML, CSS, JS, TS etc...  
  * `Base`: The base file, the origin. (optional)  
  * `Divergent`: A different version from base.  
  * `Divergent Label`: A name assigned to a assign a group to a `Divergent`  

## Design
One of Webpack's best traits is its ability to provide a build/bundle process that is a natural part of the development process.  
Start from an entry file and create a chain of dependencies, linked from one file to the other step by step, module by module.  
This approach reduces complexity and saves a lot of time, no need to over think prematurely.  
DWP provides the ability to create variations as you develop, choose the best strategy for the task/file at hand.  
If your application is already built, adding a variations is gradual process, adding a divergent to a file will not break other parts of your application.

## Supported content types
Every content that has a loader, i.e: if you can require it, it will work.

## Flow diagram

__Development__: A typical scenario - A new component is added to an application. The application has 2 variations: desktop & mobile, assume the component has 1 file.  

  

                            =========================
                            Does it need a variation?                                                              
                            =========================            
    Continue Normally  <--  NO                    YES
                                                    |
                                                    | 
                        =====================================================                         
                        Are there any shared parts between Mobile & Desktop?
                        =====================================================
                        NO                                                YES   
                         |                                                 |
                         |                                                 |
    Create 2 divergents(files), 1 for each variation.          Create 3 files:
                                                                    Base (shared) file. 
                                                                    Mobile divergent.
                                                                    Desktop Divergent.


If we answered "YES"  on all question, what is the bundled result?
Assuming we have 1 webpack entry called `app` we will have 3 chunks:  
  1. `app.js` - Main bundle, loaded statically from `index.html`  
  2. `[0].mobile.js` - Mobile specific bundle, loaded dynamically at runtime (id might change, hash might exist...)  
  3. `[1].desktop.js` - Desktop specific bundle, loaded dynamically at  (id might change, hash might exist...)  
  
The variation specific bundles can be loaded using a static HTML script tag or dynamically using your application bootstrap process.
The approach is up to the developer, depending on the use case.  
For example, in a hosted mobile/desktop application, where a user browse to a url:  
  - A dynamic approach will be to detect the device (mobile/desktop), load the appropriate chunk and then bootstrap the application.
  - A static approach will be to detect the device in the server and return the appropriate `index.html` statically pointing to the appropriate chunk.

### Notes:
  1. Using Base file is optional.
  2. Only 1 variation allowed in runtime.
  3. requiring base file from a divergent file is allowed.
  4. requiring a divergent file from a different divergent file is not allowed. (see #2)
  5. Repeating this process with multiple components will create 2 groups, referenced by their divergent names Mobile & Desktop.
  

## API:
`require.diverge( [base], divergeMap, [options]);`  

The options effect the runtime result of a the final output from a divergent mix with its base.
Options:  
  - __concat__: Concat the to values, only for modules returning strings [Boolean, default: false]  
  - __skipBase__: Do not init base. (Base will be in the bundle but it will stay cold/lazy) [Boolean, default: false]  
  - __strict__: If divergent not found throw an error (occurs when the divergent label chunk did'nt load) [Boolean, default: false]  
  
Creating a divergent is easy:

    require.diverge('./nice-component/nice-component.html', {
        desktop: './nice-component/nice-component[desktop].html',
        mobile: require('./nice-component/nice-component[mobile].html')
    }, {strict: true});

DWP provides a object that maps `Divergent Labels` and their chunk ID: `__webpack_divergent_labels__`  
To get the chunk id for "Mobile":  
```
var chunkID = __webpack_divergent_labels__['mobile'];
```

You can then use webpack's native chunk load function to load it:
  
    if (chunkID > -1) {
        __webpack_chunk_load__(chunkID, function() {
    
    });

## Strategies and common scenarios
A typical modern web application is a composition of components, a rough category split will be:  
  - UI components (menus, pages, widgets...)  
  - Service components (auth, persistent, calculation, models, validation...)  

In our example, Desktop & Mobile variation, the majority of the variations are in the UI components category.  
An average UI Component is usually composed from 3 files:

  * Javascript (Vanilla ES5 / Transpiler of your choice) 
  * HTML 
  * CSS (LESS / SCSS / etc...)

A common webpack implementation is to have the javascript file as the entry point and inside it require other files (HTML/CSS).  
Since DWP works at the file level, you can create variations only where needed and relay on shared code where possible.  

Lets review each file type:

### Javascript:
Try to avoid diverging Javascript files as much as possible, in most cases the logic does not change between variations.  
If you need to change logic it is probably a small change, consider using `composition / inheritance / monkey patching`:  
Use a `base` (shared) file, `require` the base module from a divergent file then either alter it and return it or create a new module referencing parts of the base module objects.  

In our example we have a mobile variation, mobile variations usually have more pages where a desktop page might spread over 2 pages in a mobile application.  
This is an easy task with DWP, the desktop will have 2 components, both in the same page, each with its own javascript file shared between variations.  
Since both components are in the same page in the desktop variation only 1 component will have a url assigned.  
The mobile app will "patch" the 2nd component, adding a path to it... diverged!
   
### HTML
HTML is usually a good candidate for variations, especially in UI components, in web application that utilize a templating system its a variation heaven.  
In most cases the best approach is to provide HTML divergent for every variation or to provide a base (shared) HTML template and diverged templates for some of the variations.
   
DWP supports a `concat` mode which returns a string concatenation of base + divergent, use only when module returns a string!  
It is not common to use it, but its there.  

### CSS
CSS fits right into the design. Due to the nature of CSS, in most cases, a base (shared) file is the right way.
The base (shared) module will load first, any divergent will come after having the ability to overload CSS configuration.  
A example will be an application with complete responsive design at the base (shared) level and a several mobile divergents defining specific mobile components and native element design.
  
>If you are using a pre processor to compile your CSS (LESS/SASS) there are some diverging limits your should be aware of.  
>Since pre processors run at build time, the variation is not known and variables declared in divergent files might not apply.  
>DWP does not support `@import` statements in CSS so in general try avoid using them, it might fill your variation chunk with duplicate CSS code.  

>Some CSS loaders (e.g: `style`) does not return string.


## Resolving
DWP provides several runtime resolving strategies set through the options object:  
  - concat: Concat the to values, only for modules returning strings [Boolean, default: false]
  - skipBase: Do not init base. (Base will be in the bundle but it will stay cold/lazy) [Boolean, default: false]
  - strict: If divergent not found throw an error (occurs when the divergent label chunk did'nt load) [Boolean, default: false]


A collection of divergent files with the same divergent label are actually a different version of your application, in Webpack terms it is a async chunk.  
For example, __Desktop__ & __Mobile__ divergent labels.

# TO BE CONTINUED ...