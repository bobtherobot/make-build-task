// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const myfs = require('myfs');


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getRoot() {
	var ws = vscode.workspace.workspaceFolders;
	if (ws) {
		return ws[0].uri.path;
	}
	return null;
}

function JSONparse(str) {
    var obj = null;
    try {
        obj = JSON.parse(str);
    } catch (e) {
        // ignore
    }

    if (!obj) {
        try {
            // loose JSON parse, when str looks like a normal JS object:
            //   {a:"foo"} -> converts to -> {"a":"foo"}
            // alternative is to evil eval
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
            obj = Function('"use strict";return (' + str + ')')();
        } catch (e) {
            // ignore
        }
    }

    return obj;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('makebuildtask.run', () => {
		// The code you place here will be executed every time your command is executed
		
		// vscode.workspace.openTextDocument("./package.json").then((document) => {
		// 	let text = document.getText();
		// 	console.log("text", text)
		// });

		var root = getRoot();
		if (root) {

			// -------------
			// package.json
			// -------------
			var path = root + "/package.json";
			var obj = myfs.open(path);

            if( obj ){
                obj = JSONparse(obj);
            } else {
                obj = {
                    "name": "my project",
                    "version": "1.0.0",
                    "main": "build.js",
                    "scripts": {
                      "test": "echo \"Error: no test specified\" && exit 1",
                    },
                    "author": "",
                    "license": "MIT",
                    "description": ""
                  }
            }

            

			if (obj) {

				// add to scripts
				obj.scripts = obj.scripts || {};
				obj.scripts.myDefaultBuildTask = "node ./build.js";
				save(path, obj, "json");

				// -----------
				// tasks.json
				// -----------
				path = root + "/.vscode/tasks.json";
				obj = myfs.open(path);
				if( obj ){
					obj = JSONparse(obj);
				} else {
                    obj = {
                        "version": "2.0.0",
                        "tasks": [
                            {}
                        ]
                    }
                }

				// clear out any tasks that "we" previously made
				obj.tasks = obj.tasks || [];
				if(obj.tasks.length){
					for(var i=obj.tasks.length-1; i > -1 ; i--){
						var item = obj.tasks[i];
						if(item){
							if(item.script && item.script == "myDefaultBuildTask"){
								obj.tasks.splice(i, 1);
							} else if(item.group && item.group.kind == "build" && item.group.isDefault){
								item.group.isDefault = false;
							}
						}
					}
				}
				

				// add our new task
				obj.tasks.push({
					"type": "npm",
					"script": "myDefaultBuildTask", // use same name as in package.json
					"group": {
						"kind": "build",
						"isDefault": true
					}
				});
		
				myfs.save(path, JSON.stringify(obj));

				// -----------
				// build.js
				// -----------
				// create build file (if not exist):
				var hasBuildJs = myfs.open(root + "/build.js");
				if( ! hasBuildJs ){
					var data = "// put your build process in here.\n"
					data += 'console.log("my build process");\n';
					myfs.save(root + "/build.js", data);
				}


				msg = "OK default build task ready. Use 'ctrl+shift+B' to build your task with a shortcut";
			

			} else {
				msg = "Unable to open package.json ! Please 'npm init' your project!"
			}
		} else {
			msg = "Unable to find workspace... is this a vscode project?"
		}


		// Display a message box to the user
		vscode.window.showInformationMessage(msg);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

// eslint-disable-next-line no-undef
module.exports = {
	activate,
	deactivate
}
