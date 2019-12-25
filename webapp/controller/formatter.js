/* =========================================================== */
/* App 格式实现（Utility for formatting values）               */
/* =========================================================== */
sap.ui.define([
		"sap/ui/core/format/DateFormat", 
		"sap/ui/core/format/NumberFormat", 
		"sap/ui/core/Component"
], function(DateFormat, NumberFormat, Component) {
	"use strict";

	return{
		
		splitDate: function(date){
			return date.split("T")[0];
		},
		splitDesc: function(desc){
			return desc.split("/")[0];
		},
		divide: function(amt, qty){
			if(qty!==0&&qty!==""){
				return (amt/qty).toFixed(4);
			}else{
				return 0;
			}
			
		}
	};
	
});