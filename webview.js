function propsEqual(a, b, propNames) {
	var result = true;
	for (var i in propNames) {
		var prop = propNames[i];
		if (a[prop] != b[prop]) {
			console.log("Failed to match " + prop + ": " + a[prop] + " != " + b[prop]);
			result = false;
		}
	}
	return result;
}

function query(a, b, p) {

	// if closeURL does not have a query string just return
	if (!b[p]) {
		return true
	}

	if (!a[p]) { // if closeURL has a query string and input doesn't we have a problem
		console.log("Input has no query string");
		return false;
	}

	// If input contains query component, let input-query be the result of splitting the query component into name/value pairs.
	inamevalue = a[p].substring(1).split("&");

	// If close-url contains query component, let close-query be the result of splitting the query component into name/value pairs.
	cnamevalue = b[p].substring(1).split("&");

	// If the name-value pairs of close-query are not present (though exactly matching) in the input-query, then return false
	for (var i in cnamevalue) {
		cname = cnamevalue[i].split("=")[0]; // looking at key values only of the closeURL
		present = false;
		for (var j in inamevalue) {
			iname = inamevalue[j].split("=")[0]; // looking at key values only of the input
			if (cname == iname) {
				present = true;
				console.log(cname + " matched with " + iname);
			}
		}
		if (!present) {
			return false;
		}
	}
	return true;
}

function closematch(input) {
	if (!input) {
		return false;
	}

	// 1. If the widget contains zero close URL params, return false and terminate this algorithm.
	if (typeof webview.closeURLs == 'undefined' || webview.closeURLs.length == 0) {
		return false;
	}
	// Let input be the URL to be matched.
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/urls.html#parsing-urls
	// Let parsedInput be the result of parsing input into its components parts.
	var parsedInput = document.createElement('a');
	parsedInput.href = input;

	for (var c in webview.closeURLs) {
		// For each close-url (cu) in the close URL params:
		var cu = document.createElement('a');
		cu.href = webview.closeURLs[c];

		// Compare input to the close-url. If any part of these two URLs differ other than the <query> component, return false.
		// "other than the <query> component"
		if (!propsEqual(parsedInput, cu, ["protocol", "port", "hostname", "pathname"])) {
			continue;
		}

		if (!query(parsedInput, cu, "search")) {
			continue;
		}

		if (!query(parsedInput, cu, "hash")) {
			continue;
		}

		return true;
	}
}

function opened(tab) {
	webview[tab.id] = tab.url;
	console.log("Opened: " + tab.id);
}

chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {

	// Ignore if we did not open the tab
	if (!webview[id]) {
		return;
	}

	// Store URL in webview in case user closes tab
	webview[id] = tab.url;

	if (closematch(tab.url)) {

		// onUpdated can fire numerous times and closematch is slow so lets check webview is no already deleted
		if (!webview[tab.id]) {
			return;
		}

		chrome.tabs.remove(tab.id, function() {
			console.log(tab.id + ": " + tab.url + " closed by closematch !");
		});
	}

});

chrome.tabs.onRemoved.addListener(function(id, removeInfo) {

	// Ignore if we did not open the tab
	if (!webview[id]) {
		return;
	}

	webview.onclose({
		url: webview[id]
	});

	// Delete after we sent the URL to onclose
	delete webview[id];

});

function open(url) {
	chrome.tabs.create({
		url: url
	},
	opened);
}

webview = {};
webview.open = open;
webview.closeURLs = []; // Should be overridden
webview.onclose = function(e) {} // Should be overridden

