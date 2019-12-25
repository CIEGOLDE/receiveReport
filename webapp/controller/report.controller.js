sap.ui.define([
	"./BaseController",
	"./messages",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Token",
	"./formatter"
], function (BaseController,messages,Filter,FilterOperator,MessageToast,Token,formatter) {
	"use strict";

	return BaseController.extend("cie.receiveReport.controller.report", {
		formatter: formatter,
		
		onInit: function () {
			this.getView().addStyleClass("sapUiSizeCompact");			
			this._JSONModel = this.getModel();
			this.language = this.getLanguage().split("-")[0];
			this.initValueHelpDataSet();
			this.calltempleate();
		},
		/**
		 * 初始化搜索帮助数据集
		 */
		 initValueHelpDataSet:function(){
		 	this._JSONModel.setProperty("/poSet",null);
		 	this._JSONModel.setProperty("/plantSet",null);
		 	this._JSONModel.setProperty("/supplierSet",null);
	
			this.byId("Plant").addValidator(function(args){
					var text = args.text;
					return new Token({key: text, text: text});
			});
			this.byId("PONo").addValidator(function(args){
					var text = args.text;
					return new Token({key: text, text: text});
			});
			this.byId("Supplier").addValidator(function(args){
					var text = args.text;
					return new Token({key: text, text: text});
			});
		 },
		 onSearch: function(){
		 	var that = this;
			that.byId("table").setBusy(true);
			var sUrl = "/YY1_API_Purchase_Doc";
			var oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_API_PURCHASE_DOC_CDS";
			var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);				
			var plantTokens = this.byId("Plant").getTokens();
			var poTokens = this.byId("PONo").getTokens();
			var supplierTokens = this.byId("Supplier").getTokens();
			var searchCriteriaSet= this._JSONModel.getProperty("/searchCriteriaSet");
			var allFilters = [];
			
		 	if(plantTokens.length > 0){
				for(var p = 0; p < plantTokens.length; p++){
					allFilters.push(new Filter({
						path:"Plant",
						operator: FilterOperator.EQ,
						value1: plantTokens[p].getKey()
					}));
				}
			}
			if(poTokens.length > 0){
				for(var w = 0; w < poTokens.length; w++){
					allFilters.push(new Filter({
						path:"PurchaseOrder",
						operator: FilterOperator.EQ,
						value1: poTokens[w].getKey()
					}));
				}
			}
			if(supplierTokens.length > 0){
				for(var s = 0; s < supplierTokens.length; s++){
					allFilters.push(new Filter({
						path:"Supplier",
						operator: FilterOperator.EQ,
						value1: supplierTokens[s].getKey()
					}));
				}
			}
			allFilters.push(new Filter({
				path:"GoodsMovementType",
				operator: FilterOperator.EQ,
				value1: '101'
			}));
			if(searchCriteriaSet.dateFrom !== null){
				var time1 = searchCriteriaSet.dateFrom.getTime()+28800000;//加8小时
				var time2 = searchCriteriaSet.dateTo.getTime()+28800000;//加8小时
				allFilters.push(new Filter({
					path:"MfgOrderPlannedStartDate",
					operator: FilterOperator.BT,
					value1: this.dateTostr(new Date(time1)),
					value2: this.dateTostr(new Date(time2))
				}));
			}
			var sortParameter = "PurchaseOrder,PurchaseOrderItem,MaterialDocument,MaterialDocumentItem";
			var mUrlParameter = {
				"$orderby": sortParameter
			};
			var mParameters = {
				filters: allFilters,
				urlParameters: mUrlParameter,
				success: function (oData) {
					that.byId("table").setBusy(false);
					var Arry  = oData.results;
					if (Arry.length>0) {
						that._JSONModel.setProperty("/poTableSet",Arry);
					}else{
						that._JSONModel.setProperty("/poTableSet",[]);
					}
				}.bind(this),
				error: function (oError) {
					that.byId("table").setBusy(false);
					messages.responseSplitMessage(oError);
				}
			};
			ODataModel.read(sUrl, mParameters);	
		 },
		 getValueHelpDataSet:function(type){
			var valueHelpSet = null;
			var sUrl = ""; 
			var oDataUrl = "";
			var allFilters = [];
			var dialogId = "";
			
			switch(type){
				case "Plant":
					valueHelpSet = this._JSONModel.getProperty("/plantSet");
					dialogId = "PlantDialog";
					if(valueHelpSet !== null){
						return;
					}else{
						sUrl = "YY1_PLANT_F4HELP";
						oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_PLANT_F4HELP_CDS";
					}
					break;
				case "PONo":
					valueHelpSet = this._JSONModel.getProperty("/poSet");
					dialogId = "PODialog";
					if(valueHelpSet !== null){
						return;
					}else{
						sUrl = "A_PurchaseOrder";
						oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_PURCHASEORDER_PROCESS_SRV";
					}
					break;
				case "Supplier":
					valueHelpSet = this._JSONModel.getProperty("/supplierSet");
					dialogId = "SupplierDialog";
					if(valueHelpSet !== null){
						return;
					}else{
						sUrl = "YY1_SupplierHelp";
						oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_SUPPLIERHELP_CDS";
					}
					break;
				default:
				break;
			}
			var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
			
			var mParameters = {
				filters: allFilters,
				success: function (oData, response) {
					sap.ui.getCore().byId(dialogId).setBusy(false);
					if(oData.results.length>0){
						switch(type){
							case "Plant":
								this._JSONModel.setProperty("/plantSet",oData.results);
								break;
							case "PONo":
									this._JSONModel.setProperty("/poSet",oData.results);
								break;
							case "Supplier":
									this._JSONModel.setProperty("/supplierSet",oData.results);
								break;
							default:
							break;
						}
					}else{
						MessageToast.show(this._ResourceBundle.getText("noData"));			
					}
				}.bind(this),
				error: function (oError) {
					sap.ui.getCore().byId(dialogId).setBusy(false);
				}.bind(this)
			};
			ODataModel.read(sUrl, mParameters);
		},
		 onValueHelpRequest:function(oEvent){
			var ids = oEvent.getParameters().id.split("-");
			/*
			根据id构造搜索帮助查询条件、显示内容、显示列
			*/
			this.getValueHelpDataSet(ids[2]);
			
			switch(ids[2]){
				case "Plant":
					this.theTokenInput= this.getView().byId("Plant");
					this.valueHelpDataSet = this._JSONModel.getProperty("/plantSet");
					
					if (!this._oPlantDialog) {//声明品类弹框对象
						this._oPlantDialog = sap.ui.xmlfragment("cie.receiveReport.dialog.plant", this);
					}
					this._oPlantDialog.setMultiSelect(true);//设置多选
					this._oPlantDialog.setRememberSelections(true);//设置记忆选中功能
						
					this.getView().addDependent(this._oPlantDialog);
						
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oPlantDialog);
					this._oPlantDialog.open();
					sap.ui.getCore().byId("PlantDialog").setBusy(true);
					break;
				case "PONo":
					this.theTokenInput= this.getView().byId("PONo");
					this.valueHelpDataSet = this._JSONModel.getProperty("/poSet");
					
					if (!this._oPODialog) {//声明品类弹框对象
						this._oPODialog = sap.ui.xmlfragment("cie.receiveReport.dialog.po", this);
					}
					this._oPODialog.setMultiSelect(true);//设置多选
					this._oPODialog.setRememberSelections(true);//设置记忆选中功能
						
					this.getView().addDependent(this._oPODialog);
						
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oPODialog);
					this._oPODialog.open();
					sap.ui.getCore().byId("PODialog").setBusy(true);
					break;
				case "Supplier":
					this.theTokenInput= this.getView().byId("Supplier");
					this.valueHelpDataSet = this._JSONModel.getProperty("/supplierSet");
					
					if (!this._oSupplierDialog) {//声明品类弹框对象
						this._oSupplierDialog = sap.ui.xmlfragment("cie.receiveReport.dialog.supplier", this);
					}
					this._oSupplierDialog.setMultiSelect(true);//设置多选
					this._oSupplierDialog.setRememberSelections(true);//设置记忆选中功能
						
					this.getView().addDependent(this._oSupplierDialog);
						
					jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oSupplierDialog);
					this._oSupplierDialog.open();
					sap.ui.getCore().byId("SupplierDialog").setBusy(true);
					break;
				default:
					break;
			}
		},
		/**
		* 搜索帮助点击确认
		*/
		onHandleClose:function(oEvent){//搜索帮助关闭后获取选中行，并执行查询操作
			var id = oEvent.getParameters().id;
			var oMultiInput=null;
			var tokens = [];
			switch(id){
				case "PlantDialog":
					oMultiInput = this.byId("Plant");
					break;
				case "PODialog":
					oMultiInput = this.byId("PONo");
					break;
				case "SupplierDialog":
					oMultiInput = this.byId("Supplier");
					break;
				default:
					break;
			}
				
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);
				
			var aContexts = oEvent.getParameter("selectedContexts");//获取上下文对象
			if (aContexts && aContexts.length) {
				aContexts.map(function(oContext) { 
					var item = oContext.getObject();//获取选中行
					switch(id){
						case "PlantDialog":
							tokens.push(new Token({
								text:item.PlantName,//部门名称
								key:item.Plant//部门id
							}));
							break;
						case "PODialog":
							tokens.push(new Token({
								text:item.PurchaseOrderDate,//
								key:item.PurchaseOrder//
							}));
							break;
						case "SupplierDialog":
							tokens.push(new Token({
								text:item.SupplierName,//
								key:item.Supplier//
							}));
							break;
						default:
							break;
						}
					}).join(", ");
				oMultiInput.setTokens(tokens);
			}
		},
		/**
		 * 弹框搜索
		 */
		handleSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");//获取输入值
			var id = oEvent.getParameters().id;//获取搜索帮助id
			var aFilters = [];
			switch(id){//根据id设置特定列过滤
				case "PlantDialog":
					aFilters.push(
						new sap.ui.model.Filter({
							filters: [
								new sap.ui.model.Filter({
									path: "Plant",
									operator: FilterOperator.StartsWith,
									value1: sValue
								}),
								new sap.ui.model.Filter({
									path: "PlantName",
									operator: FilterOperator.Contains,
									value1: sValue
								})
							],
							and: false
						}));
					break;
				case "PODialog":
					aFilters.push(
						new sap.ui.model.Filter({
							filters: [
								new sap.ui.model.Filter({
									path: "PurchaseOrder",
									operator: FilterOperator.StartsWith,
									value1: sValue
								}),
								new sap.ui.model.Filter({
									path: "PurchaseOrderDate",
									operator: FilterOperator.Contains,
									value1: sValue
								})
							],
							and: false
						}));
					break;
				case "SupplierDialog":
					aFilters.push(
						new sap.ui.model.Filter({
							filters: [
								new sap.ui.model.Filter({
									path: "Supplier",
									operator: sap.ui.model.FilterOperator.StartsWith,
									value1: sValue
								}),
								new sap.ui.model.Filter({
									path: "SupplierName",
									operator: sap.ui.model.FilterOperator.Contains,
									value1: sValue
								})
							],
							and: false
						}));
					break;
				default:
					break;
			}
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters);
		},
		onPrint: function(){
			this.byId("page").setBusy(true);
			var poTableSet = this._JSONModel.getProperty("/poTableSet");
			var ItemTable = this.getView().byId("table");
			var contexts = ItemTable.getSelectedContexts();
			var selectIndexArry = contexts.map(function(c) {
	        	return c.getObject();
	    	});
			if(selectIndexArry.length<1){
				sap.m.MessageBox.warning(this._ResourceBundle.getText("errMsg1"), {
					title: this._ResourceBundle.getText("Tips")
				});
				this.byId("page").setBusy(false);
				return;
			}
			var printArr = [];
			var that = this;
			if (selectIndexArry.length > 10) {
				sap.m.MessageBox.warning(this._ResourceBundle.getText("errMsg2"), {
					title: this._ResourceBundle.getText("Tips")
				});
				this.byId("page").setBusy(false);
				return;
			}
			for(var i=0;i<selectIndexArry.length;i++){
				for(var j=0;j<poTableSet.length;j++){
					if(poTableSet[j].PurchaseOrder===selectIndexArry[i].PurchaseOrder){
						printArr.push(poTableSet[j]);
					}
				}
			}
			var aXML = that.processXML(printArr, that);
			that._JSONModel.setProperty("/printTotal",aXML.length);
			that._JSONModel.setProperty("/b64Set", []);
			that._JSONModel.setProperty("/printError", false);
			for (var k = 0; k < aXML.length; k++){
				that.printadobe(aXML[k]);
			}
		},
		printadobe: function (xml) {
			var that = this;
			var pUrl = "/adsrestapi/v1/adsRender/pdf";
			var template = this._JSONModel.getProperty("/printTemplate");
			var total = this._JSONModel.getProperty("/printTotal");
			var str1 = that.Base64Encode(xml); //base64编码
			var oRequest = "{\"xdpTemplate\":\"" + template + "\",\"xmlData\": \"" + str1 + "\"}";
			that.postpdf(pUrl, oRequest).then(function (r) {
				var b64Set = that._JSONModel.getProperty("/b64Set");
				if(b64Set.length+1 == total){
					b64Set.push(r);
					that.pdfMerge(b64Set);
				}else{
					b64Set.push(r);
					that._JSONModel.setProperty("/b64Set", b64Set);
				}
			}).catch(function (oError) {
				if(!that._JSONModel.setProperty("/printError")){
					that.byId("page").setBusy(false);
					that._JSONModel.setProperty("/printError",true);
					messages.showODataErrorText(oError);
				}
			});
		},

		calltempleate: function () {
			// var response = "";
			var that = this;
			var aData = $.ajax({
				url: "/adsrestapi/v1/forms/ZCP_Receive_Report/templates",
				type: "GET",
				data: "",
				dataType: "json",
				contentType: "application/json;charset=\"utf-8\"",
				Accept: "application/json",

				success: function (data, textStatus, jqXHR) {
					var template = data[0].xdpTemplate;
					that._JSONModel.setProperty("/printTemplate", template);
					that.byId("btnPrint").setProperty("enabled",true);
				},
				error: function (xhr, status) {
					sap.m.MessageBox.error(that._ResourceBundle.getText("errMsg4"), {
						title: that._ResourceBundle.getText("errBox")
					});
				}
			});
		},
		postpdf: function (oUrl, oRequest) {
			var response = "";
			var that = this;
			var promise = new Promise(function (resolve, reject) {
				var aData = $.ajax({
					url: oUrl,
					type: "POST",
					data: oRequest,
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",

					success: function (data, textStatus, jqXHR) {
						response = data.fileContent;
						resolve(response);
					},
					error: function (xhr, status) {
						reject(xhr);
					}
				});
			});
			return promise;
		},
		pdfMerge: function(b64Set){
			var that = this;
			var aData = $.ajax({
				url: "/pdfMerge",
				type: "POST",
				data: JSON.stringify( b64Set ),
				dataType: "json",
				contentType: "application/json;charset=\"utf-8\"",
				Accept: "application/json",

				success: function (data, textStatus, jqXHR) {
					var result = data.base64PDF;
					// that.byId("table").clearSelection();
					that.byId("table").removeSelections();
					that.pdfPreview(result);	
				},
				error: function (xhr, status) {
					that.byId("page").setBusy(false);
					sap.m.MessageBox.error(that._ResourceBundle.getText("errMsg5"), {
						title: that._ResourceBundle.getText("errBox")
					});
				}
			});
		},
		pdfPreview: function (pdfBase64) {
			var decodedPdfContent = atob(pdfBase64);
			var byteArray = new Uint8Array(decodedPdfContent.length);
			for (var i = 0; i < decodedPdfContent.length; i++) {
				byteArray[i] = decodedPdfContent.charCodeAt(i);
			}
			var blob = new Blob([byteArray.buffer], {
				type: 'application/pdf'
			});
			var _pdfurl = URL.createObjectURL(blob);

			if (!this._PDFViewer) {
				this._PDFViewer = new sap.m.PDFViewer({
					width: "auto",
					source: _pdfurl
				});
				jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
			}else{
				this._PDFViewer.setProperty("source",_pdfurl);
			}
			this.byId("page").setBusy(false);
			this._PDFViewer.open();
		},
		processXML: function (aDoc) {
			var aXML = [];
			var xml = "";
			var item = "";
			var price =0;
			for (var i = 0; i < aDoc.length; i++) {
				if(aDoc[i].OrderQuantity!==0&&aDoc[i].OrderQuantity!==""){
					price = (aDoc[i].NetAmount/aDoc[i].OrderQuantity).toFixed(4);                         
				}
				item = item + "<Items><PurchaseDocument>" + aDoc[i].PurchaseOrder + "</PurchaseDocument>";
				item = item + "<PurchaseDocumentItem>" + aDoc[i].PurchaseOrderItem + "</PurchaseDocumentItem>";
				item = item + "<SupplierDesc>" + aDoc[i].SupplierFullName.split("/")[0] + "</SupplierDesc>";
				item = item + "<Material>" + aDoc[i].Material + "</Material>";
				item = item + "<MaterialDescription>" + aDoc[i].PurchaseOrderItemText + "</MaterialDescription>";
				item = item + "<ReceiveDate>" + aDoc[i].DocumentDate.split("T")[0] + "</ReceiveDate>";
				item = item + "<Ordered>" + aDoc[i].OrderQuantity + "</Ordered>";
				item = item + "<Received>" + aDoc[i].QuantityInEntryUnit + "</Received>";
				item = item + "<Unit>" + aDoc[i].PurchaseOrderQuantityUnit + "</Unit>";
				item = item + "<UnitPrice>" + price + "</UnitPrice>";
				item = item + "<ExtPrice>" + aDoc[i].NetAmount + "</ExtPrice>";
				item = item + "<Currency>" + aDoc[i].DocumentCurrency + "</Currency></Items>";
				if(aDoc[i + 1] === undefined){
					xml="<?xml version=\"1.0\" encoding=\"UTF-8\"?><Form><PurchaseDocumentNode>";
					xml = xml+item+"</PurchaseDocumentNode></Form>";
					aXML.push(xml);
					item = "";
				}else if(aDoc[i].PurchaseOrder !== aDoc[i + 1].PurchaseOrder){
					xml="<?xml version=\"1.0\" encoding=\"UTF-8\"?><Form><PurchaseDocumentNode>";
					xml = xml+item+"</PurchaseDocumentNode></Form>";
					aXML.push(xml);
					item = "";
				}
			}
			return aXML;
		},
		handleTableClicked: function(oEvent){
			var oItem = oEvent.getSource();
			oItem.attachSelect();
		}
	});
});