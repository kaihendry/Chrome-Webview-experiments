closeURLs = ["http://example.com/close/me", "http://close.me.2", "http://close.me.3", "http://kaihendry.greptweet.com/?foo", "http://hendry.iki.fi"];

function assert(a, b, message) {
	if (a != b) {
		console.log("Failed to match " + message + " " + a + " != " + b);
		return false;
	}
	return true;
}

function closematch(input) {
	if (undefined === input) {
		return false;
	}
	// 1. If the widget contains zero close URL params, return false and terminate this algorithm.
	if (undefined === closeURLs) {
		return false;
	}
	// Let input be the URL to be matched.
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/urls.html#parsing-urls
	// Let parsedInput be the result of parsing input into its components parts.
	var parsedInput = document.createElement('a');
	parsedInput.href = input;

	for (var c in closeURLs) {
		// For each close-url (cu) in the close URL params:
		var cu = document.createElement('a');
		cu.href = closeURLs[c];

		// Compare input to the close-url. If any part of these two URLs differ other than the <query> component, return false.
		// "other than the <query> component" currently protocol, port, hostname, hash
		if (!assert(parsedInput.protocol, cu.protocol, "protocol")) {
			continue;
		}
		if (!assert(parsedInput.port, cu.port, "port")) {
			continue;
		}
		if (!assert(parsedInput.hostname, cu.hostname, "hostname")) {
			continue;
		}
		if (!assert(parsedInput.hash, cu.hash, "hash")) {
			continue;
		}

		if (cu.search) {

			if (!parsedInput.search) {
				console.log("Input has no query string");
				continue;
			}

			// If input contains query component, let input-query be the result of splitting the query component into name/value pairs.
			inamevalue = parsedInput.search.substring(1).split("&");

			// If close-url contains query component, let close-query be the result of splitting the query component into name/value pairs.
			cnamevalue = cu.search.substring(1).split("&");

			// If the name-value pairs of close-query are not present (though exaclty matching) in the input-query, then return false
			for (var i in cnamevalue) {
				cname = cnamevalue[i].split("=")[0];
				present = false;
				for (var j in inamevalue) {
					iname = inamevalue[j].split("=")[0];
					if (cname == iname) {
						present = true;
						console.log(cname + " matched with " + iname);
					}
				}
				if (!present) {
					return false;
				}
			}
		}

			return true;
		}
	}

	function opened(tab) {
		tabId = tab.id;
		console.log(tab.url);

		chrome.tabs.onUpdated.addListener(function(id, changeInfo, tab) {
			if (id != tabId) {
				return;
			} // Only listen to the tabId we opened (assuming just the one was opened)
			if (closematch(tab.url)) {
				chrome.tabs.remove(id, function() {
					console.log(tabId + " closed!");
				});
			}
		});
	}

	function openit() {
		url = "http://example.com";
		chrome.tabs.create({
			url: url
		},
		opened);
	}

