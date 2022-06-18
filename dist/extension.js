// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const fs = require("fs")


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function getRoot() {
	var ws = vscode.workspace.workspaceFolders;
	if (ws) {
		return ws[0].uri.path;
	}
	return null;
}
function open(path, kind) {
	kind = kind || "text";
	var str;
	try {
		str = fs.readFileSync(path, { encoding: 'utf8' });
	} catch(err) {

	}
	
	if(str){
		if(kind == "json"){
			return JSON.parse(str);
		} else {
			return str;
		}
	} else {
		return false;
	}
	
}

function save(path, data, kind) {
	kind = kind || "text"
	var ok = false;

	if(kind == "json"){
		try {
			var str = JSON.stringify(data, null, 2);
			fs.writeFileSync(path, str, { encoding: 'utf8' });
			ok = true;
		} catch (err) {
			// ignore
		}
	} else {
		try {
			fs.writeFileSync(path, data, { encoding: 'utf8' });
			ok = true;
		} catch (err) {
			// ignore
		}
	}
	

	return ok;


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
			var obj = open(path, "json");


			if (obj) {

				// add to scripts
				obj.scripts = obj.scripts || {};
				obj.scripts.myDefaultBuildTask = "node ./build.js";
				save(path, obj, "json");

				// -----------
				// tasks.json
				// -----------
				path = root + "/.vscode/tasks.json";
				obj = open(path, "json");
				if( !obj ){
					obj = {}
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
		
				save(path, obj, "json");

				// -----------
				// build.js
				// -----------
				// create build file (if not exist):
				var hasBuildJs = open(root + "/build.js", "text");
				if( ! hasBuildJs ){
					var data = "// put your build process in here.\n"
					data += 'console.log("my build process");\n';
					save(root + "/build.js", data, "text");
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
