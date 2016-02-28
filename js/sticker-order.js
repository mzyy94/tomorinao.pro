var global = global || {};
function updateTotal() {
	with(document) {
		var subtotal = querySelector("#subtotal");
		var total = querySelector("#total");
		var price = querySelector("#price");
		var quantity = querySelector("#quantity");
		var discount = querySelector("#discount");
		var giftlabel = querySelector("#giftlabel");
		var giftcode = querySelector("#giftcode");
		subtotal.innerHTML = price.selectedOptions[0].value * quantity.selectedOptions[0].value;
		discount.innerHTML = ~~global.discount * quantity.selectedOptions[0].value;
		total.innerHTML = subtotal.innerHTML - discount.innerHTML + 100;
		giftlabel.setAttribute("data-price", total.innerHTML);
		if (!!!~~(total.innerHTML)) {
			var method = querySelector("#method");
			var blank = createElement("option");
			method.options.add(blank);
			method.selectedIndex = 2;
			method.disabled = true;
		} else {
			var method = querySelector("#method");
			if (method.options.length > 1) {
				method.options.remove(2);
			}
			method.disabled = false;
		}
		updateMethod();
	}
}

function updateMethod() {
	with(document) {
		var method = querySelector("#method").options;
		if (method.selectedIndex == 2) {
			var inputs = querySelectorAll('#methods input');
			for (var i = 0; i < inputs.length; ++i) {
				inputs[i].required = false;
			}
			var methods = querySelectorAll("#methods > div");
			for (var i = 0; i < methods.length; ++i) {
				methods[i].hidden = true;
			}
			return;
		}
		var active = querySelector("#" + method[method.selectedIndex].value);
		var inactive = querySelector("#" + method[1 - method.selectedIndex].value);
		var activeInputs = active.querySelectorAll('input');
		var inactiveInputs = inactive.querySelectorAll('input');
		for (var i = 0; i < activeInputs.length; ++i) {
			activeInputs[i].required = true;
		}
		for (var i = 0; i < inactiveInputs.length; ++i) {
			inactiveInputs[i].required = false;
		}
		active.hidden = false;
		inactive.hidden = true;
	}
}

function applyCoupon() {
	var flag = document.querySelector("#coupon").value;
	var sha384 = new jsSHA("SHA-384", "TEXT");
	sha384.update(flag);
	if (sha384.getHash("HEX") == "16f78df92287c52a9d033a97a2b915a24cd96b0f2a6dbe2c6349f9869b5adb466ae1ffbd01e0b2de2a362a8927388faf") {
		var sha512 = new jsSHA("SHA-512", "TEXT");
		sha512.update(flag);
		global.flaghash = sha512.getHash("HEX").slice(-9);
		global.discount = ~~flag.match(/[0-9]+/);
		updateTotal();
		return false;
	}
	var qr0 = qr.canvas({
		value: flag.slice(0, ~~(flag.length / 3)),
		background: '#000',
		foreground: '#F00',
		size: 1
	});
	var qr1 = qr.canvas({
		value: flag.slice(~~(flag.length / 3), ~~(flag.length / 3) * 2),
		background: 'rgba(0,0,0,0)',
		foreground: '#0F0',
		size: 1
	});
	var qr2 = qr.canvas({
		value: flag.slice(~~(flag.length / 3) * 2),
		background: 'rgba(0,0,0,0)',
		foreground: '#00F',
		size: 1
	});
	var canvas = document.createElement("canvas");
	canvas.width = 25;
	canvas.height = 25;
	ctx = canvas.getContext("2d");
	ctx.globalCompositeOperation = "lighter";
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(qr0, 0, 0);
	ctx.drawImage(qr1, 0, 0);
	ctx.drawImage(qr2, 0, 0);

	ctx.globalCompositeOperation = "difference";
	ctx.drawImage(document.querySelector("#problem"), 0, 0);

	var check = document.createElement("canvas");
	check.width = 25;
	check.height = 25;
	ctx2 = check.getContext("2d");
	ctx2.fillStyle = "#fff";
	ctx2.fillRect(0, 0, check.width, check.height);
	ctx2.globalCompositeOperation = "difference";
	ctx2.drawImage(canvas, 0, 0, check.width, check.height);
	document.querySelector("#result").appendChild(check);

	var colors = ctx2.getImageData(0, 0, check.width, check.height).data;
	for (var i=0; i < colors.length; ++i) {
		if (colors[i] != 255) {
			return false;
		}
	}
	var sha512 = new jsSHA("SHA-512", "TEXT");
	sha512.update(flag);
	global.flaghash = sha512.getHash("HEX").slice(-9);
	global.discount = ~~flag.match(/[0-9]+/);
	updateTotal();
}

function getOderInfo() {
	var data = "";
	var attr = ["name", "email", "postcode", "state", "city", "address"]

	with(document) {
		for(var i = 0; i < attr.length; i++){
			var query = querySelector("#" + attr[i]);
			if (!query || query.required && (!query.value || (!!query.validity && !query.validity.valid))) {
				query.focus();
				return null;
			}
			data += query.value + "	";
		}

		var method = querySelector("#method").selectedOptions[0];
		if (method.value == "amazon-egift") {
			var query = querySelector("#giftcode");
			if (!query || query.required && (!query.value || (!!query.validity && !query.validity.valid))) {
				query.focus();
				return null;
			}
			data += query.value + "	";
		} else if(method.value == "credit-card") {
			if (!global.token) {
				alert("Create token first.");
				return null;
			}
			data += global.token + "	";
		} else {
			data += "	";
		}

		data += querySelector("#quantity").selectedOptions[0].value + "	";
		data += querySelector("#price").selectedOptions[0].value + "	";
		data += global.flaghash + "	";
		data += (+new Date()).toString(36);
	}
	return data;
}

function validateCreditCard() {
	with(document) {
		var attr = ["cardNumber", "name2", "expiry", "cvc"];
		for(var i = 0; i < attr.length; i++){
			var query = querySelector("#" + attr[i]);
			if (!query || query.required && !query.value) {
				query.focus();
				return false;
			}
		}

		var number = querySelector("#cardNumber").value;
		var name = querySelector("#name2").value;
		var expiry = querySelector("#expiry").value;
		var cvc = querySelector("#cvc").value;

		var numberCheck = cardValidator.number(number);
		if (!numberCheck.isValid) {
			alert("Invalid Credit Card Number.");
			return false;
		}
		var expiryCheck = cardValidator.expirationDate(expiry);
		if (!expiryCheck.isValid) {
			alert("Invalid Credit Card expiration Date.");
			return false;
		}

		var supportedCard = (global.cardTypes.indexOf(numberCheck.card.niceType) != -1);
		if (!supportedCard) {
			alert("Unsupported Credit Card type.");
			return false;
		}

		var card = {
			number: number.replace(/ /g, ''),
			name: name,
			cvc: cvc.trim(),
			exp_month: expiryCheck.month,
			exp_year: "20" + expiryCheck.year
		};

		Payjp.createToken(card, function(status, response) {
			if (status == 200) {
				global.token = response.id;
				var inputs = querySelectorAll('#credit-card input');
				for (var i = 0; i < inputs.length; ++i) {
					inputs[i].required = false;
				}
				var elements = querySelectorAll("#credit-card > *:not(.card)");
				for (var i = 0; i < elements.length; ++i) {
					elements[i].hidden = true;
				}
				querySelector("#credit-card > input[type=button]").type = "hidden";
				querySelector("#method").disabled = true;
				// Non-supported protection
				querySelector("#credit-card > h4").hidden = false;
				querySelector("input[type=submit]").disabled = true;
				var sha512 = new jsSHA("SHA-512", "TEXT");
				sha512.update(global.token);
				var p = createElement("p");
				p.style.textAlign = "center";
				p.innerHTML = "Token: " + sha512.getHash("HEX").slice(-16);
				querySelector("#credit-card").appendChild(p);
			} else {
				alert(response.error.message);
			};
		});
	}
}

function createRequest() {
	var input = getOderInfo();
	if (!input) {
		return false;
	}
	var crypt = new JSEncrypt();
	var message = document.querySelector("#message");
	crypt.setPublicKey(global.pubkey);
	var encrypted = crypt.encrypt(input);
	if (!encrypted) {
		alert("Error: Bad input\n\nPlease check the input fields.");
		return false;
	}
	message.innerHTML = encrypted;
	return false;
}

function initialize() {
	(function getPublicKey() {
		var url = "/publickey";
		var xhr = new XMLHttpRequest();
		xhr.onload = function(e) {
			global.pubkey = xhr.responseText;
		}
		xhr.open("GET" , url);
		xhr.send(null);
	})();

	if (!!Payjp) {
		Payjp.setPublicKey("pk_test_0383a1b8f91e8a6e3ea0e2a9");
		Payjp.retrieveAvailability(function(status, response) {
			if (status == 200) {
				global.cardTypes = response["card_types_supported"];
			} else {
				alert("Pay.jp service is not available.")
			};
		});
	} else {
		console.warn("PayJP Service is not available.");
	}
	var card = new Card({
		form: 'form',
		container: '.card',
		formSelectors: {
			numberInput: 'input#cardNumber',
			expiryInput: 'input#expiry',
			cvcInput: 'input#cvc',
			nameInput: 'input#name2'
		}
	});
	updateMethod();
}

initialize();
