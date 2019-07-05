/*
 * Author: AlexV525
 * Created: 20180108
 */
(function ($) {
    "use strict";

    $.extend({
        postJSON: function(url, data) {  // 扩展postJSON
            return $.ajax({
                url: url,
                type: "POST",
                data: data,
                dataType: "JSON"
            })
        }
    });

    var $body         = $("body"),
        $year         = $("#bg-year"),
        $container    = $(".container"),
        /*** 五大块div ***/
        // $userProfile  = $("div.userProfile"),
        // $userSetting  = $("div.userSetting"),
        // $billTotal    = $("div.billTotal"),
        // $billChart    = $("div.billChart"),
        // $billButton   = $("div.billButton"),
        /*** 查看宿舍信息 ***/
        $getroommate  = $("#getroommate"),
        /*** 两表+一查询按钮 ***/
        $eleTable     = $("#eleTable"),
        $roomTable    = $("#roomTable"),
        $tableFetch   = $("#tableFetch"),
        /*** 两种记录查询按钮 ***/
        $eleCharge    = $("button.btn-eleCharge"),
        $eleRecord    = $("button.btn-eleRecord");

    var $chart = {
            usage: {
                instance: null,
                get: function() {
                    var echartEl = $("#echarts")[0];
                    echarts.dispose(echartEl);
                    $chart.usage =  echarts.init(echartEl);
                }
            }
        },
        $datepicker = {
            el: $("#datepicker"),
            init: function() {
                var date = new Date();
                date = date.getFullYear()+"/"+(date.getMonth()+1);
                $datepicker.el.datepicker({
                    endDate: date,
                    format: "yyyy-mm",
                    startView: 1,
                    minViewMode: 1,
                    maxViewMode: 2,
                    language: "zh-CN",
                    autoclose: true
                });
                $datepicker.el.datepicker("update", date);
            }
        },
        $modal = {
            ele: $("#eleModal"),
            room: $("#roomModal"),
            setting: $("#settingModal")
        },
        $notify = {
            el: {
                save: $(".btn-save-setting"),
                switch: $("#switch"),
                threshold: $(".field-threshold")
            },
            check: function() {
                return !(
                    $notify.setting.on &&
                    $notify.setting.threshold === 0 &&
                    $notify.setting.threshold >= $notify.min &&
                    $notify.setting.threshold <= $notify.max
                );
            },
            compare: function() {
                return JSON.stringify($notify.setting) === JSON.stringify($modal.setting.data("setting"));
            },
            max: 99,
            min: 10,
            setting: {
                on: false,
                threshold: 0
            }
        },
        $loader = {
            el: $(".loader"),
            inner: $(".loader-inner"),
            error: {
                container: $(".loader-errormsg"),
                message: $(".loader-errormsg .error-type")
            },
            height: 100,
            toggle: function() {
                if (!$failed.apis) $loader.hide();
            },
            init: function() {
                $loader.inner.fadeIn();
            },
            show: function() {
                if (!$body.hasClass("fixed")) $body.addClass("fixed");
                if (!$container.hasClass("op-0")) $container.addClass("op-0");
                $loader.el.fadeIn();
                // $userProfile.removeClass("animated bounceInUp");
                // $userSetting.removeClass("animated bounceInUp");
                // $billTotal.removeClass("animated bounceInUp");
                // $billChart.removeClass("animated bounceInUp");
                // $billButton.removeClass("animated bounceInUp");
            },
            hide: function() {
                setTimeout(function() {
                    $loader.el.fadeOut();
                    $body.removeClass("fixed");
                    $container.removeClass("op-0");
                    // $userProfile.addClass("animated bounceInUp");
                    // $userSetting.addClass("animated bounceInUp");
                    // $billTotal.addClass("animated bounceInUp");
                    // $billChart.addClass("animated bounceInUp");
                    // $billButton.addClass("animated bounceInUp");
                }, 1000);
            },
            resize: function(height) {
                var margin = (($(window).height() - height) / 2) + "px";
                $loader.inner.css({
                    "margin": margin + " auto",
                    "height": height
                });
            }
        },
        $failed = {
            apis: 3,
            reason: "",
            show: function() {
                if ($failed.reason === "") $failed.reason = "获取数据出错(EMPTY_RESPONSE)";
                $loader.error.message.text($failed.reason);
                $loader.error.container.removeClass("op-0");
                $loader.resize($loader.height+90);
            },
            hide: function() {
                $failed.reason = "";
                $loader.error.message.text($failed.reason);
                $loader.error.container.addClass("op-0");
                $loader.resize($loader.height);
            }
        };

    /*** 接口聚合 ***/
    var $apis = {
        baseUrl: "",
        eleBasicInfo: function() { return $.getJSON($apis.baseUrl + "qry/ele-basic-info") },
        eleUsageChart: function() { return $.getJSON($apis.baseUrl + "qry/ele-usage-chart") },
        eleCharge: function(date) { return $.getJSON($apis.baseUrl + "qry/ele-charge", {date: date}) },
        eleRecord: function(date) { return $.getJSON($apis.baseUrl + "qry/ele-record", {date: date}) },
        getRoomMate: function() { return $.getJSON($apis.baseUrl + "qry/get-roommate") },
        notifySetting: {
            get: function() { return $.getJSON($apis.baseUrl + "notify") },
            post: function() { return $.postJSON($apis.baseUrl + "notify", $notify.setting) }
        }
    };

    /*** 回调聚合 ***/
    var $get = {
        year: function() { $year.text(new Date().getFullYear()) },
        basicInfo: function(response) {
            var $username  = $("#username"),
                $userroom   = $("#userroom"),
                $countNow    = $(".countNow.KWh"),
                $countLast    = $(".countLast.KWh"),
                $countMonth    = $(".countMonth.KWh"),
                $countBalance   = $(".countBalance.KWh");
            var user  = response["user"],
                room   = response["room"],
                nowKWh  = response["nowKWh"],
                lastKWh  = response["lastKWh"],
                monthKWh  = response["monthKWh"],
                balanceKWh = response["balanceKWh"];
            if (!nowKWh) nowKWh = 0;
            if (!monthKWh) monthKWh = nowKWh;
            $username.text(user);
            $userroom.text(room);
            $countNow.text(nowKWh);
            $countLast.text(lastKWh);
            $countMonth.text(monthKWh);
            $countBalance.text(balanceKWh);
            $loader.toggle();
        },
        usageChart: function(response) {
            $chart.usage.get();
            $chart.usage.setOption({
                backgroundColor: "#191F29",
                textStyle: { color: "#fff" },
                title: {
                    text: "近30天用电",
                    subtext: "*用电量为采集间隔用电量",
                    textStyle: { color: "#fff" }
                },
                tooltip: { trigger: "axis" },
                xAxis: {
                    data: response["dateList"],
                    axisLine: {
                        lineStyle: { color: "#fff" }
                    }
                },
                yAxis: {
                    splitLine: { show: false },
                    axisLine: {
                        lineStyle: { color: "#fff" }
                    }
                },
                visualMap: {
                    top: 10,
                    right: 10,
                    pieces: [
                        { gt: 0, lte: 10, color: "#096" },
                        { gt: 10, lte: 20, color: "#ffde33" },
                        { gt: 20, lte: 30, color: "#ff9933" },
                        { gt: 30, lte: 40, color: "#cc0033" },
                        { gt: 40, lte: 50, color: "#660099" },
                        { gt: 50, color: "#7e0023" }
                    ],
                    outOfRange: { color: "#999" },
                    textStyle: { color: "#fff" }
                },
                series: {
                    name: "用电量",
                    type: "line",
                    data: response["valueList"],
                    label: { textStyle: { color: "#fff" } }
                }
            });
            $loader.toggle();
        },
        charge: function(date) {
            $apis.eleCharge(date)
                .done(function(response) {
                    if (responseSuccess(response["status"])) {
                        $modal.ele.find(".modal-title").text("充值记录");
                        $eleTable.bootstrapTable("destroy");
                        $eleTable.bootstrapTable({
                            data: response["data"]["rows"],
                            dataType: "JSON",
                            striped: true,
                            cache: false,
                            // uniqueId: "rownum_",
                            columns: [/*{
                                "field": "rownum_",
                                "class": "text-center",
                                "title": "#"
                            }, */{
                                "field": "purchaseTime",
                                "class": "text-center",
                                "title": "充值时间",
                                "formatter": function(value) {
                                    value = value.substr(0,16);
                                    return value;
                                }
                            }, {
                                "field": "user",
                                "class": "text-center",
                                "title": "充值用户"
                            }, {
                                "field": "purchaseElec",
                                "class": "text-center",
                                "title": "充值电量"
                            }, {
                                "field": "paymentAmount",
                                "class": "text-center",
                                "title": "充值金额"
                            }]
                        });
                    } else {
                        console.error("Failed in ele-charge: " + response["status"] + response["message"]);
                    }
                })
                .fail(function(xhr, status) {
                    console.error("Failed in ele-charge: " + xhr.status + status);
                });
        },
        record: function(date) {
            $apis.eleRecord(date)
                .done(function(response) {
                    if (responseSuccess(response["status"])) {
                        $modal.ele.find(".modal-title").text("用电记录");
                        $eleTable.bootstrapTable("destroy");
                        $eleTable.bootstrapTable({
                            data: response["data"]["rows"],
                            dataType: "json",
                            striped: true,
                            cache: false,
                            // uniqueId: "rownum_",
                            columns: [{
                                "field": "collectionTime",
                                "class": "text-center",
                                "title": "采集日期"
                            }, {
                                "field": "currentUsed",
                                "class": "text-center",
                                "title":  "采集用电 "+
                                    '<i '+
                                    'class="fa fa-question-circle" '+
                                    'data-toggle="tooltip" '+
                                    'data-original-title="本列显示采集间隔时间的总计用电量" '+
                                    '></i>'
                            }, {
                                "field": "surplusElec",
                                "class": "text-center",
                                "title": "剩余电量"
                            }/*, {
                                "field": "cjsj",
                                "class": "text-center",
                                "title": "采集时间"
                            }*/]
                        });
                    } else {
                        console.error("Failed in ele-record: " + response["status"] + response["message"]);
                    }
                })
                .fail(function(xhr, status) {
                    console.error("Failed in ele-record: " + xhr.status + status);
                });
        },
        roommate: function(response) {
            var data = response["rows"];
            var $tbody = $roomTable.find("tbody");
            $.each(data, function(i, user) {
                var tr ='<tr>'+
                    '<td>'+user["xh"]+'</td>'+
                    '<td>'+user["xm"]+'</td>'+
                    '<td>'+user["sslmc"]+' '+user["fjh"]+'</td>'+
                    '</tr>';
                $tbody.append(tr);
            });
        },
        notifySetting: function(response) {
            var on = response["on"],
                threshold = response["threshold"];
            $notify.setting = response;
            $modal.setting.data("setting", JSON.parse(JSON.stringify(response)));
            $notify.el.threshold.val(threshold);
            if (on) $notify.el.switch.trigger("click");
            $loader.toggle();
        }
    };

    /*** 创建队列Deffered ***/
    var $queue = function() {
        return $.when(
            $apis.eleBasicInfo()
                .done(function(response) {
                    if (responseSuccess(response["status"])) {
                        $failed.apis--;
                        $get.basicInfo(response["data"]);
                    }
                    else $failed.reason += "基础信息获取失败("+response["status"]+"/"+response["message"]+")";
                })
                .fail(function(xhr, status) {
                    $failed.reason += "基础信息获取失败("+xhr.status+"/"+status+")";
                })
            ,
            $apis.eleUsageChart()
                .done(function(response) {
                    if (responseSuccess(response["status"])) {
                        $failed.apis--;
                        $get.usageChart(response["data"]);
                    }
                    else $failed.reason += "使用趋势获取失败("+response["status"]+"/"+response["message"]+")";
                })
                .fail(function(xhr, status) {
                    $failed.reason += "使用趋势获取失败("+xhr.status+"/"+status+")";
                })
            ,
            $apis.notifySetting.get()
                .done(function(response) {
                    if (responseSuccess(response["status"])) {
                        $failed.apis--;
                        $get.notifySetting(response["data"]);
                    }
                    else $failed.reason += "提醒设置获取失败("+response["status"]+"/"+response["message"]+")";
                })
                .fail(function(xhr, status) {
                    $failed.reason += "提醒设置获取失败("+xhr.status+"/"+status+")";
                })
        )
    };

    $(document)
        .ready(function() {
            $loader.init();
            $get.year();
            $queue();
        })
        .on("ajaxStop", function() {
            $("[data-toggle='tooltip']").tooltip();
        });
    $(window).resize(function() {
        $chart.usage.resize();
    });

    /*** 宿舍信息相关请求及DOM操作 ***/
    $getroommate.on("click", function() {
        $apis.getRoomMate()
            .done(function(response) {
                if (responseSuccess(response["status"])) $get.roommate(response);
            })
            .fail(function(xhr, status) {
                console.error("Failed in get-roommate: "+xhr.status, status);
            });
    });
    $modal.room.on("hidden.bs.modal", function() {
        $(this).find("tbody").empty();
    });

    /*** 电量详情相关请求及DOM操作 ***/
    $modal.ele.on("hidden.bs.modal", function() {
        $eleTable.bootstrapTable("destroy");
        $datepicker.el.datepicker("destroy");
    });
    $eleCharge.on("click", function() {  // 充值记录按钮
        $datepicker.init();
        $tableFetch.off("click");
        $tableFetch.on("click", function() { $get.charge($datepicker.el.datepicker("getFormattedDate")) });
        $get.charge($datepicker.el.datepicker("getFormattedDate"));
    });
    $eleRecord.on("click", function() {  // 用电记录按钮
        $datepicker.init();
        $tableFetch.off("click");
        $tableFetch.on("click", function() { $get.record($datepicker.el.datepicker("getFormattedDate")) });
        $get.record($datepicker.el.datepicker("getFormattedDate"));
    });

    /*** 电量提醒相关DOM操作 ***/
    $modal.setting.on("hidden.bs.modal", function() {
        $notify.setting = JSON.parse(JSON.stringify($(this).data("setting")));
        $notify.el.threshold.val($notify.setting.threshold);
        if ($notify.setting.on) {
            $notify.el.switch.prop("checked", true);
            $notify.el.threshold.parent().removeClass("hidden");
        } else {
            $notify.el.switch.prop("checked", false);
            $notify.el.threshold.parent().addClass("hidden");
        }
        $notify.el.save.prop("disabled", true);
    });
    $notify.el.save.on("click", function() {
        var _this = this;
        $(_this).prop("disabled", true);
        swal({
            title: "更改确认",
            text: "确定"+($notify.setting.on ? "开启" : "关闭")+"电量提醒"+($notify.setting.on ? "并将提醒阈值设置为"+$notify.setting.threshold+"°？" : "？"),
            icon: "warning",
            buttons: {
                cancel: "取消",
                confirm: "确认"
            },
            dangerMode: true
        }).then(function(confirm) {
            if (confirm) {
                $apis.notifySetting.post()
                    .done(function(response) {
                        if (responseSuccess(response["status"])) {
                            $modal.setting.data("setting", JSON.parse(JSON.stringify($notify.setting)));
                            swal("更改成功", "已成功修改电量提醒设置", "success")
                                .then(function() {
                                    $modal.setting.modal("hide")
                                });
                        } else {
                            $(_this).prop("disabled", false);
                            swal({
                                content: $("<p>更改设置失败<br><code>"+response["status"]+"/"+response["message"]+"</code></p>")[0],
                                icon: "error"
                            });
                            console.error("Failed in POST settings: ("+response["status"]+"/"+response["message"]+")");
                        }
                    })
                    .fail(function(xhr, status) {
                        $(_this).prop("disabled", false);
                        swal({
                            content: $("<p>更改设置失败<br><code>"+xhr.status+"/"+status+"</code></p>")[0],
                            icon: "error"
                        });
                        console.error("Failed in POST settings: ("+xhr.status+"/"+status+")");
                    });
            } else {
                $(_this).prop("disabled", false);
            }
        });
    });
    $notify.el.switch.on("change", function() {
        $(this).prop("checked") ? $notify.el.threshold.parent().removeClass("hidden") : $notify.el.threshold.parent().addClass("hidden");
        if (!$(this).prop("checked") && !$notify.compare()) {
            $notify.el.threshold.val($modal.setting.data("setting")["threshold"]);
        }
        $notify.setting = {
            on: $(this).prop("checked"),
            threshold: parseInt($notify.el.threshold.val())
        };
        if (!$notify.compare() && $notify.check()) {
            $notify.el.save.prop("disabled", false);
        } else {
            $notify.el.save.prop("disabled", true);
        }
    });
    $notify.el.threshold
        .on("keydown", function(event) {  // 仅对电脑有效
            console.log(event.key);
            if (
                (  // old migration
                    event.keyCode !== 8 &&    // BackSpace
                    event.keyCode !== 12 &&   // Clear
                    event.keyCode !== 46 &&   // Delete
                    event.keyCode !== 109 &&  // -
                    event.keyCode !== 110 &&  // .
                    event.keyCode !== 189 &&  // -_
                    event.keyCode !== 190     // .>
                )
                &&
                (  // new migration
                    event.key !== "Backspace" &&
                    event.key !== "Delete" &&
                    event.key !== "Clear" &&
                    event.key !== "." &&
                    event.key !== "-"
                )
            ) {
                return !($(this).val().length === parseInt($(this).attr("maxlength")));
            }
        })
        .on("input propertychange compositionend", function() {
            $(this).val($(this).val().substring(0,2));

            if (parseInt($(this).val()) >= $notify.min && parseInt($(this).val()) <= $notify.max) {  // 范围控制
                $notify.setting.threshold = parseInt($(this).val());
            } else if (/0\d{0,2}/.test($(this).val().toString())) {  // 屏蔽0开头
                $(this).val($(this).val().substr(1,1));
            }

            if (!$notify.compare() && $notify.check()) {
                $notify.el.save.prop("disabled", false);
            } else {
                $notify.el.save.prop("disabled", true);
            }
        })
        .on("blur", function() {
            if (!$(this).val()) {
                $(this).val($modal.setting.data("setting")["threshold"]);
            } else if ($(this).val() < 10) {
                $notify.setting.threshold = 10;
                $(this).val(10);
            }
        });

    /*** 返回response是否成功 ***/
    function responseSuccess(status) { return status === "success" }

})(jQuery);