
let KeyPad = Backbone.Model.extend({});

let KeyPadCollection = Backbone.Collection.extend({
	model: KeyPad
});

let KeyPadView = Backbone.View.extend({
	currentNum: 0,
	result: 0,
	displayedNumber: 0,
	history: [],
	memory: [],
	stack: [],
	stack_op: [],
	op_clicked: false,
	events: {
		"mouseup .btn": "keyPadClick",
	},
	initialize: function (options) {
		this.template = options.template;
		this.render();
		_.bindAll(this, 'on_keypress');
		$(document).bind('keypress', this.on_keypress);
	},
	render: function () {
		console.log(this)
		keyPadTemplate = _.template($(this.template).html(), {
			keyPads: this.collection.models
		});
		this.$el.html(keyPadTemplate);
		return this;
	},
	on_keypress: function (e) {
		console.log(e.keyCode)
		let stringPressed = String.fromCharCode(e.keyCode);
		if (e.keyCode === 13) {
			$('#op-equal').mouseup();
			return;
		} else if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode == 46) {
			this.processInput(stringPressed);
		}
		switch (e.keyCode) {
			case 43:
				$('#op-plus').mouseup();
				break;
			case 45:
				$('#op-minus').mouseup();
				break;
			case 42:
				$('#op-multiply').mouseup();
				break;
			case 47:
				$('#op-divide').mouseup();
				break;
			case 37:
				$('#op-percent').mouseup();
				break;
		}
	},
	keyPadClick: function (e) {
		let item = this.collection.get(e.target.id);
		console.log(e.target.id, item.get("type"))
		switch (item.get("type")) {
			case 'num':
				this.processInput(item.get('value'));
				break;
			case 'op':
				this.doOperation(item);
				break;
			case 'op-1':
				this.doOperationOneParam(item);
				break;
			case 'memory':
				this.setMemory(item.get('value'));
				break;
			case 'negate':
				this.switchSign();
				break;
			case 'equal':
				this.stack.push(this.currentNum);
				this.equal();
				break;
			case 'CE':
				this.clearStack();
				break;
		}

	},
	processInput: function (input) {
		this.op_clicked = false;
		if (input == '.') {
			this.handleDecimal(input);
		} else if (this.currentNum === 0) {
			this.currentNum = Number(input);
		} else {
			this.currentNum += input;
			this.currentNum = Number(this.currentNum);
		}
		this.displayNum(this.currentNum);
	},
	setMemory: function (input) {
		console.log(input);
		switch (input) {
			case 'M+':
				this.memory.push(this.displayedNumber);
				this.currentNum = 0;
				break;
			case 'M-':
				this.memory.push(this.displayedNumber * (-1));
				this.currentNum = 0;
				break;
			case 'MRC':
				let sum = 0;
				this.memory.forEach(i => {
					sum = sum + i;
				});
				this.memory = [];
				this.displayNum(sum);
				this.currentNum = 0;
				break;
		}
	},
	handleDecimal: function (dot) {
		numString = String(this.currentNum);
		if (numString.indexOf('.') == -1) {
			if (this.currentNum == 0) {
				this.currentNum = '0.';
			} else {
				this.currentNum += '.';
			}
		}
	},
	doOperation: function (item) {
		if (!this.op_clicked) {
			this.op_clicked = true;
			this.stack.push(this.currentNum);
			this.history.push(this.displayedNumber);
			this.history.push(item.get('value'));
			if (this.stack_op.length == 0 || this.stack.length == 1) {
				this.stack_op.push(item);
			} else {
				this.showResult();
				this.stack = [this.result];
				this.stack_op.push(item);
			}
			this.currentNum = 0;
		} else {
			this.op_clicked = true;
			this.stack_op = [];
			this.stack_op.push(item);
		}
	},
	doOperationOneParam: function (item) {
		if (this.displayedNumber != 0) {
			this.history.push(this.displayedNumber);
			this.history.push(item.get('value'));
			this.result = item.attributes.calc(this.displayedNumber);
			this.stack.push(this.result);
			this.currentNum = this.result;
			this.displayNum(this.result);
		}
	},
	switchSign: function () {
		this.currentNum = this.displayedNumber;
		if (this.currentNum != 0) {
			this.currentNum *= -1;
			this.displayNum(this.currentNum);
		} else {
			this.stack[this.stack.length - 1] *= -1;
			this.displayNum(this.stack[this.stack.length - 1]);
		}

	},
	clearStack: function () {
		this.stack = [];
		this.stack_op = [];
		this.history = [];
		this.currentNum = 0;
		this.op_clicked = false;
		this.displayNum(this.currentNum);
		$("#calc-history-box").text("");
	},
	clearEntry: function () {
		this.currentNum = 0;
		this.displayNum(this.currentNum);
	},
	enterNum: function () {
		// if (this.currentNum != 0) {
		// 	this.stack.push(this.currentNum);
		// 	this.currentNum = 0;
		// }
	},
	displayNum: function (num) {
		this.displayedNumber = num;
		let maxDigits = 12;
		if (this.getLength(num) > maxDigits) {
			$('#expression').html(num.toExponential(maxDigits));
		} else {
			$('#expression').html(num);
		}

	},
	getLength: function (number) {
		return number.toString().length;
	},
	showResult: function () {
		if (this.stack_op.length == 0) {
			return;
		}
		let operator = this.stack_op.pop();
		this.stack_op = [];
		console.log(operator)
		this.result = operator.attributes.calc(this.stack[0], this.stack[1]);
		this.currentNum = this.result;
		this.stack = []
		this.displayNum(this.result);
	},
	equal: function () {
		this.history.push(this.currentNum);
		if (this.stack_op.length == 0) {
			return;
		}
		let operator = this.stack_op[0];
		this.result = operator.attributes.calc(this.stack[0], this.stack.length > 1 ? this.stack[1] : this.stack[0]);
		this.stack = [];
		this.stack_op = [];
		this.displayNum(this.result);
		$("#calc-history-box").append("<p style='color: #B0B0B0; word-break: break-all; ' class='calc-history-eq' id='eq'>" + this.history.join(' ') + "</p>");
		$("#calc-history-box").append("<p style='text-align: right; margin-top: -10px;'>= " + this.result + "</p>")
		this.history = [];
		this.currentNum = this.displayedNumber;
	}
});

let keyPads = new KeyPadCollection([{
	value: 'M+',
	id: 'op-memo_plus',
	class: 'button-orange',
	type: 'memory'
}, {
	value: 'M-',
	id: 'op-memo_minus',
	class: 'button-orange',
	type: 'memory'
}, {
	value: 'MRC',
	id: 'op-memo_rc',
	class: 'button-orange',
	type: 'memory',
	calc: function (arr) {
		return arr;
	}
}, {
	value: '+/-',
	id: 'op-negate',
	class: 'button-orange',
	type: 'negate'
}, {
	value: 'CE',
	id: 'op-clear',
	class: 'button-orange',
	type: 'CE'
}, {
	value: '7',
	id: 'num-7',
	class: 'num',
	type: 'num'
}, {
	value: '8',
	id: 'num-8',
	class: 'num',
	type: 'num'
}, {
	value: '9',
	id: 'num-9',
	class: 'num',
	type: 'num'
}, {
	value: '%',
	id: 'op-percent',
	class: 'button-blue',
	type: 'op-1',
	calc: function (a) {
		return a / 100;
	}
}, {
	value: '√',
	id: 'op-sqroot',
	class: 'button-blue',
	type: 'op-1',
	calc: function (a) {
		return Math.sqrt(a);
	}
}, {
	value: '4',
	id: 'num-4',
	class: 'num',
	type: 'num'
}, {
	value: '5',
	id: 'num-5',
	class: 'num',
	type: 'num'
}, {
	value: '6',
	id: 'num-6',
	class: 'num',
	type: 'num'
}, {
	value: '&times',
	id: 'op-multiply',
	class: 'button-blue',
	type: 'op',
	calc: function (a, b) {
		return a * b;
	}
}, {
	value: '&divide',
	id: 'op-divide',
	class: 'button-blue',
	type: 'op',
	calc: function (a, b) {
		return a / b;
	}
}, {
	value: '1',
	id: 'num-1',
	class: 'num',
	type: 'num'
}, {
	value: '2',
	id: 'num-2',
	class: 'num',
	type: 'num'
}, {
	value: '3',
	id: 'num-3',
	class: 'num',
	type: 'num'
}, {
	value: '+',
	id: 'op-plus',
	class: 'height-2 button-blue',
	type: 'op',
	calc: function (a, b) {
		return a + b;
	}
}, {
	value: '&#8722',
	id: 'op-minus',
	class: 'button-blue',
	type: 'op',
	calc: function (a, b) {
		return a - b;
	}
}, {
	value: '0',
	id: 'num-0',
	width: '2',
	class: 'width-2 num',
	type: 'num'
}, {
	value: '.',
	id: 'num-dot',
	width: '2',
	class: 'num',
	type: 'num'
}, {
	value: '=',
	id: 'op-equal',
	class: 'button-blue',
	type: 'equal'
},
{
	value: '√',
	id: 'op-sqroot',
	class: 'button-blue',
	type: 'op-1',
	calc: function (a) {
		return Math.sqrt(a);
	}
}, {
	id: "op-power",
	type: 'op',
	class: 'button-blue',
	value: "^",
	calc: function(a, b) {
	  return Math.pow(a, b);
	}
  },
{
	id: "op-log",
	type: 'op-1',
	class: 'button-blue',
	value: "log",
	calc: function(a) {
	  return Math.log10(a);
	}
  },
{
	id: "op-natural-log",
	type: 'op-1',
	class: 'button-blue',
	value: "ln",
	calc: function(a) {
	  return Math.log(a);
	}
  },
{
	id: "op-sin",
	type: 'op-1',
	class: 'button-blue',
	value: "sin",
	calc: function(a) {
	  return Math.sin(a);
	}
  },
{
	id: "op-cos",
	type: 'op-1',
	class: 'button-blue',
	value: "cos",
	calc: function(a) {
	  return Math.cos(a);
	}
  },
{
	id: "op-tan",
	type: 'op-1',
	class: 'button-blue',
	value: "tan",
	calc: function(a) {
	  return Math.tan(a);
	}
  },
{
	id: "op-inverse-sin",
	type: 'op-1',
	class: 'button-blue',
	value: "asin",
	calc: function(a) {
	  return Math.asin(a);
	}
  },
{
	id: "op-inverse-cos",
	type: 'op-1',
	class: 'button-blue',
	value: "acos",
	calc: function(a) {
	  return Math.acos(a);
	}
  },
{
	id: "op-inverse-tan",
	type: 'op-1',
	class: 'button-blue',
	value: "atan",
	calc: function(a) {
	  return Math.atan(a);
	}
  }]);

let trigonometryKeyPads = new KeyPadCollection([]);

keyPads = new KeyPadView({
	// model: new KeyPad(),
	template: '#key-pad-template',
	collection: keyPads,
	el: $('#standard-buttons'),
});

function toggleAdvanced() {
	$("#advanced-buttons").toggle();
	if ($("#advanced-buttons").is(":visible")) {
		$("#toggle-advanced").removeClass("button-off");
		$("#toggle-advanced span").removeClass("glyphicon-triangle-bottom").addClass("glyphicon-triangle-top");
	} else {
		$("#toggle-advanced").addClass("button-off");
		$("#toggle-advanced span").removeClass("glyphicon-triangle-top").addClass("glyphicon-triangle-bottom");
	}
}