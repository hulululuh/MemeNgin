import { GraphicsItem } from "./scene/graphicsitem";
import { NodeScene } from "./scene";
import { DesignerLibrary } from "./designer/library";
import { FrameGraphicsItem } from "./scene/framegraphicsitem";
import { Color } from "./designer/color";
import { CommentGraphicsItem } from "./scene/commentgraphicsitem";
import { NavigationGraphicsItem } from "./scene/navigationgraphicsitem";
import { Designer } from "./designer";
import { DesignerNode } from "./designer/designernode";
import { NodeGraphicsItem } from "./scene/nodegraphicsitem";
import { DesignerNodeConn } from "./designer/designerconnection";
import { SocketType } from "./scene/socketgraphicsitem";
import { ConnectionGraphicsItem } from "./scene/connectiongraphicsitem";
import { Guid } from "./utils";
import { AddItemsAction } from "./actions/additemsaction";
import { UndoStack } from "./undostack";
import { Rect, Vector2 } from "./scene/view";

export class ItemClipboard {
	public static copyItems(
		designer: Designer,
		library: DesignerLibrary,
		scene: NodeScene,
		clipboard: DataTransfer
	) {
		clipboard.clearData();
		let items = scene.selectedItems;
		if (items.length == 0) {
			// empty clipboard
			clipboard.setData("text/nodes", "");
		}

		let data = {
			nodes: [],
			connections: [],
			comments: [],
			frames: [],
			navigations: [],
			libraryVersion: "",
		};

		// NODES AND CONNECTIONS
		let nodeList: NodeGraphicsItem[] = [];
		items.forEach((i) => {
			// check if this works with obfuscated code
			if (i instanceof NodeGraphicsItem)
				nodeList.push(<NodeGraphicsItem>i);
		});

		data.nodes = this.getNodes(designer, nodeList);
		data.connections = this.getConnections(data.nodes, designer, nodeList);

		// FRAMES
		var frames = [];
		for (let item of items) {
			if (!(item instanceof FrameGraphicsItem)) continue;
			let frame = <FrameGraphicsItem>item;

			var n: any = {};
			n["x"] = frame.left;
			n["y"] = frame.top;
			n["width"] = frame.getWidth();
			n["height"] = frame.getHeight();

			n["title"] = frame.title;
			n["showTitle"] = frame.showTitle;
			n["description"] = frame.description;
			n["color"] = frame.color.toHex();

			frames.push(n);
		}
		data.frames = frames;

		// COMMENTS
		var comments = [];
		for (let item of items) {
			if (!(item instanceof CommentGraphicsItem)) continue;
			let comment = <CommentGraphicsItem>item;

			var n: any = {};
			n["x"] = comment.left;
			n["y"] = comment.top;

			n["text"] = comment.text;
			n["color"] = comment.color.toHex();

			comments.push(n);
		}
		data.comments = comments;

		// NAVIGATIONS
		var navs = [];
		for (let item of items) {
			if (!(item instanceof NavigationGraphicsItem)) continue;
			let nav = <NavigationGraphicsItem>item;

			var n: any = {};
			n["x"] = nav.left;
			n["y"] = nav.top;

			navs.push(n);
		}
		data.navigations = navs;

		// let data = scene.save(); // do to items
		data.libraryVersion = library.getVersionName();

		let json = JSON.stringify(data);
		console.log(data);

		clipboard.setData("json/nodes", json);
	}

	public static pasteItems(
		designer: Designer,
		library: DesignerLibrary,
		scene: NodeScene,
		clipboard: DataTransfer
	) {
		let json = clipboard.getData("json/nodes");
		//console.log(json);
		if (json == null || json == "") return;

		let data = JSON.parse(json);
		if (!data) return;

		let frames: FrameGraphicsItem[] = [];
		let comments: CommentGraphicsItem[] = [];
		let navs: NavigationGraphicsItem[] = [];
		let cons: ConnectionGraphicsItem[] = [];
		let nodes: NodeGraphicsItem[] = [];
		let dnodes: DesignerNode[] = [];

		// for selecting pasted items
		let focusItems: GraphicsItem[] = [];

		// FRAMES
		if (data.frames) {
			for (let d of data.frames) {
				let frame = new FrameGraphicsItem(scene.view);
				frame.setPos(d.x, d.y);
				frame.setSize(d.width, d.height);

				frame.setTitle(d.title);
				frame.setShowTitle(d.showTitle);
				frame.setDescription(d.description);
				frame.color = Color.parse(d.color);

				scene.addFrame(frame);
				frames.push(frame);
				focusItems.push(frame);
			}
		}

		// COMMENTS
		if (data.comments) {
			for (let d of data.comments) {
				let comment = new CommentGraphicsItem(scene.view);
				comment.setPos(d.x, d.y);
				comment.setText(d.text);
				comment.color = Color.parse(d.color);

				scene.addComment(comment);
				comments.push(comment);
				focusItems.push(comment);
			}
		}

		// NAVIGATION
		if (data.navigations) {
			for (let d of data.navigations) {
				let nav = new NavigationGraphicsItem();
				nav.setPos(d.x, d.y);
				scene.addNavigation(nav);
				navs.push(nav);
				focusItems.push(nav);
			}
		}

		//NODES AND CONNECTIONS

		// old : new
		var nodeIdMap = {};
		// add them to designer then add them to scene
		for (let n of data.nodes) {
			console.log(n.typeName);
			let dNode = library.create(n.typeName);

			// add to designer
			designer.addNode(dNode);
			nodeIdMap[n.id] = dNode.id;

			// assign properties
			for (let propName in n.properties) {
				dNode.setProperty(propName, n.properties[propName]);
			}

			// create scene version
			var node = new NodeGraphicsItem(dNode.title);
			for (let input of dNode.getInputs()) {
				node.addSocket(input, input, SocketType.In);
			}
			node.addSocket("output", "output", SocketType.Out);
			node.id = dNode.id;
			scene.addNode(node);
			focusItems.push(node);

			// generate thumbnail
			var thumb = designer.generateImageFromNode(dNode);
			node.setThumbnail(thumb);

			node.setCenter(n.x, n.y);

			nodes.push(node);
			dnodes.push(dNode);
		}
		// console.log(nodeIdMap);

		// console.log(scene.nodes);

		// add connections
		for (let c of data.connections) {
			console.log(c);
			// map to ids of new nodes
			let leftId = nodeIdMap[c.leftNodeId];
			let rightId = nodeIdMap[c.rightNodeId];

			// create connection
			var con = new ConnectionGraphicsItem();
			con.id = Guid.newGuid(); // brand new connection

			// get nodes
			var leftNode = scene.getNodeById(leftId);
			var rightNode = scene.getNodeById(rightId);

			// get sockets
			con.socketA = leftNode.getOutSocketByName(c.leftNodeOutput);
			con.socketB = rightNode.getInSocketByName(c.rightNodeInput);

			// callback triggers the creation in designer
			scene.addConnection(con);

			cons.push(con);
		}

		if (
			frames.length != 0 ||
			comments.length != 0 ||
			navs.length != 0 ||
			cons.length != 0 ||
			nodes.length != 0 ||
			dnodes.length != 0
		) {
			// gather bounding box and center items to screen
			if (focusItems.length > 0) {
				let rect = this.getItemsBounds(focusItems);
				let center = scene.view.sceneCenter;

				// find diff, then offset each object by that diff
				//let diff = Vector2.subtract(center, rect.center);
				for (let item of focusItems) {
					let offsetFromRect = Vector2.subtract(
						item.getPos(),
						rect.center
					);
					let newPos = Vector2.add(center, offsetFromRect);
					item.setPos(newPos.x, newPos.y);
					//item.move(diff.x, diff.y);
				}
			}

			// add undo-redo
			let action = new AddItemsAction(
				scene,
				designer,
				frames,
				comments,
				navs,
				cons,
				nodes,
				dnodes
			);
			UndoStack.current.push(action);

			// make items selected
			scene.setSelectedItems(focusItems, true);
		}
	}

	// merge designer and scene node in one
	// scene node only has x and y values
	static getNodes(
		designer: Designer,
		items: NodeGraphicsItem[]
	): Array<object> {
		let dnodes = [];
		items.forEach((i) => {
			let node = designer.getNodeById(i.id);

			var n = {};
			n["id"] = node.id;
			n["typeName"] = node.typeName;
			n["exportName"] = node.exportName;
			//n["inputs"] = node.inputs;// not needed imo

			var props = {};
			for (let prop of node.properties) {
				props[prop.name] = prop.getValue();
			}
			n["properties"] = props;

			n["x"] = i.centerX();
			n["y"] = i.centerY();

			dnodes.push(n);
		});

		return dnodes;
	}

	static getConnections(
		nodeList: Array<object>,
		designer: Designer,
		items: NodeGraphicsItem[]
	): Array<object> {
		let conns = [];

		// we're searching for connections with both left and right socket
		// in our selection pool
		designer.conns.forEach((con) => {
			if (
				ItemClipboard.getNodeById(con.leftNode.id, nodeList) &&
				ItemClipboard.getNodeById(con.rightNode.id, nodeList)
			) {
				var c = {};
				c["id"] = con.id;
				c["leftNodeId"] = con.leftNode.id;
				c["leftNodeOutput"] = con.leftNodeOutput;
				c["rightNodeId"] = con.rightNode.id;
				c["rightNodeInput"] = con.rightNodeInput;

				conns.push(c);
			}
		});

		return conns;
	}

	static getNodeById(id: string, nodeList: Array<object>): object {
		for (let node of nodeList) if (node["id"] == id) return node;

		return null;
	}

	static getItemsBounds(items: GraphicsItem[]): Rect {
		let rect: Rect = items[0].getRect();
		for (let item of items) {
			let r = item.getRect();
			rect.expandByRect(r);
		}

		return rect;
	}
}
