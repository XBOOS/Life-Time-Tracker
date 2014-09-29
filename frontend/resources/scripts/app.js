define(function(require, exports) {
    'use strict';
    var d3 = require('d3');
    var CalHeatMap = require('./libs/cal-heatmap');
    var Highcharts = require('highcharts');
    var $ = require('jquery');
    var moment = require('moment');
    //在这里添加highchart的全局设置
    Highcharts.setOptions({
        global: {
            useUTC: false
        },
        plotOptions: {
            series: {
               // animation: false
            }
        }
    });


    exports.initialize = function() {
        //create calendar heatmap for sport time
        createSportCalendarHeatMap();
        createSleepPeriodLine();
    };

    function createSportCalendarHeatMap() {
        var calendar = new CalHeatMap();
        d3.json("/calendars/sport/2014", function(error, data) {
            var renderData = {};
            data.forEach(function(val) {
                var seconds = new Date(val.date).getTime() / 1000;
                renderData[seconds] = val.sportTime;
            });
            calendar.init({
                id: 'sport-calendar',
                data: renderData,
                start: new Date(2014, 0),
                domain: "month",
                subDomain: "day",
                cellSize: 10,
                cellPadding: 2
            });
        });
    }

    function createSleepPeriodLine() {
        $.get('/sleepPeriods/2014')
            .done(function(result) {
                var data = toHighchartsData(result);
                drawLine(data, {
                    $el: $('#sleepPeriod')
                });
            });

        function toHighchartsData(rawData) {
            var wakeLine = {
                name: 'wake',
                data: []
            };
            var sleepLine = {
                name: 'sleep',
                data: []
            };
            var midnight = moment().startOf('day').unix() * 1000;
            rawData.forEach(function (day) {
                var dateTS = moment(day.date).unix() * 1000;
                var wakeData = wakeLine.data;
                var sleepData = sleepLine.data;
                var wakeMoment = new moment(day.wakeMoment);
                var sleepMoment = new moment(day.sleepMoment);
                console.log(day.date, sleepMoment.hours(), sleepMoment.minutes());
                wakeData.push([dateTS, getYAxisValue(wakeMoment)]);
                sleepData.push([dateTS, getYAxisValue(sleepMoment)]);


                function getYAxisValue(m) {
                    var hours = m.hours();
                    if (hours >= 0 && hours <= 12) {
                        //next midnight
                        return midnight + m.hours() * 3600000 + m.minutes() * 60000 + 3600000 * 24;
                    } else {
                        return midnight + m.hours() * 3600000 + m.minutes() * 60000;
                    }
                }
            });
            return {
                series: [wakeLine, sleepLine]
            };
        }

        function drawLine(data, options) {
            var highchartsOptions = {
                chart: {
                    type: 'spline'
                },
                title: {
                    text: '睡眠曲线'
                },
                xAxis: {
                    type: 'datetime',
                    dateTimeLabelFormats: { // don't display the dummy year
                        millisecond: '%H:%M:%S.%L',
                        second: '%H:%M:%S',
                        minute: '%H:%M',
                        hour: '%H:%M',
                        day: '%m-%e',
                        week: '%e. %b',
                        month: '%b \'%y',
                        year: '%Y'
                    }
                },
                yAxis: [{
                    title: '', //不需要标题
                    type: 'datetime',
                    dateTimeLabelFormats: { // don't display the dummy year
                        hour: '%H:%M',
                        day: '%H:%M'
                    }
                }],
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%Y-%m-%e}: {point.y:%H:%m}'
                },

                legend: {
                    itemStyle: {
                        fontFamily: '微软雅黑'
                    }
                },
                series: data.series
            };
            /*
            if (options.granularity === 'day') {
                highchartsOptions.xAxis.tickInterval = 24 * 3600 * 1000;
            }*/
            options.$el.highcharts(highchartsOptions);
        }
    }
});