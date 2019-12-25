sap.ui.define(["sap/ui/core/mvc/Controller", 
	           "sap/ui/core/UIComponent", 
	           "sap/ui/core/routing/History", 
	           "cie/receiveReport/model/formatter"
], function(Controller, UIComponent, History, formatter) {
	//---JS 严格模式
	"use strict";
	
	return Controller.extend("cie.receiveReport.controller.BaseController", {
        
		//---格式
		formatter : formatter,
		
		//---获取EventBus
		getEventBus : function() {
			return this.getOwnerComponent().getEventBus();
		},
		
		//---获取Router(路由实例)
		getRouter : function() {
			return UIComponent.getRouterFor(this);
		},
		
		//---获取RouterId(路由Id)
		getRouterID : function() {
			var oHC = this.getRouter().oHashChanger;
			if (oHC.privgetCurrentShellHash) {
				var sHash = oHC.privgetCurrentShellHash().hash;
				var s = oHC.privstripLeadingHash(sHash).split("-")[0];
				s = s && s === "Shell-home" ? null : s;
				return s;
			}
		},
		
		//---跳转
		navTo : function(sName) {
			return sName == null ? null : this.getRouter().navTo(sName);
		},
		
		//---获取模型
		getModel : function(sName) {
			return this.getView().getModel(sName) || this.getOwnerComponent().getModel(sName);
		},

		// 获取OData元数据
		getODataMetadata : function(sName) {
			if (sName == "") {
				return null;
			}
			var oMetaData = this.getModel().getProperty("/ODataMetadata");
			return oMetaData[sName];
		},

		//---获取OData服务EntityType
		getEntityTypeByName : function(sODataName, sEntityTypeName) {
			if (!this.getODataMetadata(sODataName)) {
				return null;
			}
			return this.getODataMetadata(sODataName)._getEntityTypeByName(sEntityTypeName);
		},

		//---设置模型
		setModel : function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		//---获取资源包
		getResourceBundle : function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		//---设置busy状态
		setBusy : function(b) {
			this.getModel().setProperty("/appProperties/busy", b);
		},

		//---设置bcode的值(同步方式)
		setbcode : function(v) {
			this.getModel().setProperty("/appProperties/bcode", v, false);
		},

		//---获取bcode的值
		getbcode : function(v) {
			return this.getModel().getProperty("/appProperties/bcode");
		},

		//---设置fcode的值(同步方式)
		setfcode : function(v) {
			this.getModel().setProperty("/appProperties/fcode", v, false);
		},

		//---是否是E类型消息
		isError : function(oContext) {
			var iCounterE = oContext.getModel().getProperty("/messages/counterE");
			return iCounterE > 0 ? true : false;
		},

		//---页面左上角message按钮弹框
		openMessagePopover : function(oContext) {
			if (oContext._MessageButton && this.isError(oContext)) {
				oContext._MessageButton.firePress();
			}
		},

		//---返回消息处理
		updateObligatory : function() {
			var oObligatory = {};
			var aReturn = this.getModel().getProperty("/returns");
			for (var i = 0; i < aReturn.length; i++) {
				if (aReturn[i].MessageV1 != "" && aReturn[i].Type == "E") {

					var oR = {
						Id : aReturn[i].Id,
						LogMsgNo : aReturn[i].LogMsgNo,
						LogNo : aReturn[i].LogNo,
						Message : aReturn[i].Message,
						MessageV1 : aReturn[i].MessageV1,
						MessageV2 : aReturn[i].MessageV2,
						MessageV3 : aReturn[i].MessageV3,
						MessageV4 : aReturn[i].MessageV4,
						Number : aReturn[i].Number,
						Row : aReturn[i].Row,
						System : aReturn[i].System };

					if (aReturn[i].MessageV2 != "") {
						if (!oObligatory[aReturn[i].MessageV1]) {
							oObligatory[aReturn[i].MessageV1] = {};
						}
						oObligatory[aReturn[i].MessageV1][aReturn[i].MessageV2] = oR;
					}

					if (aReturn[i].MessageV2 == "") {
						oObligatory[aReturn[i].MessageV1] = oR;
					}

				}
			}
			this.getModel().setProperty("/verReturn", oObligatory, false);

		},

		//---清除组件上必输错误状态标记
		clearInputRequiredErrorStatus : function(oEvent) {
			var sRootPath = "/verReturn";
			var sPath = oEvent.getSource().getBinding("valueState").sPath;
			if (sPath == "") {
				var aBindings = oEvent.getSource().getBinding("valueState").aBindings;
				sPath = aBindings[0].sPath + "/" + aBindings[1].oValue;
			}
			var oVerReturn = this._JSONModel.getProperty(sRootPath);
			sPath = sPath.replace(sRootPath + "/", "");
			var aKey = sPath.split("/", 2);
			if (aKey.length == 1) {
				delete oVerReturn[aKey[0]];
			}
			if (aKey.length == 2) {
				delete oVerReturn[aKey[0]][aKey[1]];
				// 表格中错误状态无法自动置空，需强制清理
				oEvent.getSource().setValueState("None");
			}
			this._JSONModel.setProperty(sRootPath, oVerReturn, false);
		},

		//---获取页面的聚合内容
		getPage : function() {
			var oView = this.getView();
			if (oView.getMetadata()._sClassName != "sap.ui.core.mvc.XMLView") {
				return null;
			}
			if (!oView.getContent() || oView.getContent().length == 0) {
				return null;
			}
			if (oView.getContent()[0].getMetadata()._sClassName != "sap.m.Page") {
				return null;
			}
			return oView.getContent()[0];
		},

		//---生成32位随机数
		createGUID : function() {
			var g = "";
			var i = 32;
			while (i--) {
				g += Math.floor(Math.random() * 16.0).toString(16);
			}
			return g;
		},

		//---重写克隆方法
		clone : function(obj, sub) {
			var o;
			if (obj.constructor == Object) {
				o = new obj.constructor();
			}
			else {
				o = new obj.constructor(obj.valueOf());
			}
			for ( var key in obj) {
				if (o[key] != obj[key]) {
					if (typeof (obj[key]) == 'object') {
						o[key] = this.clone(obj[key]);
					}
					else {
						o[key] = obj[key];
					}
				}
			}
			o.toString = obj.toString;
			o.valueOf = obj.valueOf;
			return o;
		},
        
        unique: function(arr){
        	var array = arr;
        	var len = array.length;
        	array.sort();
        	function loop(index){
        		if(index >=1){
        			if(array[index]===array[index-1]){
        				array.splice(index,1);
        			}
        			loop(index-1);
        		}
        	}
        	loop(len-1);
        	return array;
        },
        clearObject: function(obj){
        	var object = {};
        	return object;
        },
		//---返回事件
		onNavBack : function() {
			if (History.getInstance().getPreviousHash() !== undefined) {
				history.go(-1);
			}
			else {
				this.getRouter().navTo("", {}, true);
			}
		},
		getLanguage: function(){
			var sLanguage = sap.ui.getCore().getConfiguration().getLanguage();
			switch (sLanguage) {
				case "zh-Hant":
					sLanguage = "ZF";
					break;
				case "zh-Hans":
				case "zh-CN":
					sLanguage = "ZH";
				break;
			case "EN":
				sLanguage = "EN";
				break;
			default:
				break;
			}
			return sLanguage;
		},
		dateTostr: function(datetime){
			var year = datetime.getFullYear();
			var month = datetime.getMonth()+1;//js从0开始取 
			var date = datetime.getDate(); 
			var hour = datetime.getHours(); 
			var minutes = datetime.getMinutes(); 
			var second = datetime.getSeconds();
			month = (month < 10 ? "0" + month : month);
			date  = (date < 10 ? "0" + date : date);
			hour  = (hour < 10 ? "0" + hour : hour);	
			minutes  = (minutes < 10 ? "0" + minutes : minutes);			
			second  = (second < 10 ? "0" + second : second);					
			var time = year+"-"+month+"-"+date+"T"+hour+":"+minutes+":"+second; //2009-06-12T17:18:05
			return time;
		},
		
		addZero: function (num,length){
		    var numstr = num.toString();
		    var l=numstr.length;
		    if (numstr.length>=length) {
		    	return numstr;
			    }
		    for(var  i = 0 ;i<length - l;i++){
		      numstr = "0" + numstr;  
		     }
		    return numstr; 
		 },
		 
		 timeZoneConvert: function (date, time, diff){
		 	var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
		 	var originDate = date.split("T")[0];
			var originTime = time;
			var toDate = "";
			var hour = parseInt(originTime.substring(2,4),10);
			if(hour+8>=24){
				var startDate = new Date(originDate.replace(/-/g,"/"));
				var value = startDate .getTime();         
				value += 24 * 3600 * 1000;        
				var endDate = new Date(value);
				toDate = dateFormat.format(endDate);
				hour= hour +diff - 24;
			}else{
				var newDate = new Date(originDate.replace(/-/g,"/"));
				toDate = dateFormat.format(newDate);
				hour= hour +diff;
			}
			if(hour.length===1){
				hour = "0" + hour.toString();
			}
			var toTime = hour+":"+originTime.substring(5,7);
			return toDate + " " + toTime;
		 },
		 Base64Encode: function (input) {
			var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;
			input = this.utf8_encode(input);
			while (i < input.length) {
				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);
				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;
				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}
				output = output +
					_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
					_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
			}
			return output;
		},
		// private method for UTF-8 encoding
		utf8_encode: function (string) {
			string = string.replace(/\r\n/g, "\n");
			var utftext = "";
			for (var n = 0; n < string.length; n++) {
				var c = string.charCodeAt(n);
				if (c < 128) {
					utftext += String.fromCharCode(c);
				} else if ((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				} else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
			}
			return utftext;
		},
	});
});