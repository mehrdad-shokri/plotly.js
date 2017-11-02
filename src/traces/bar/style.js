/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');

module.exports = function style(gd, cd) {
    var s = cd ? cd[0].node3 : d3.select(gd).selectAll('g.trace.bars');
    var barcount = s.size();
    var fullLayout = gd._fullLayout;

    // trace styling
    s.style('opacity', function(d) { return d[0].trace.opacity; })

    // for gapless (either stacked or neighboring grouped) bars use
    // crispEdges to turn off antialiasing so an artificial gap
    // isn't introduced.
    .each(function(d) {
        if((fullLayout.barmode === 'stack' && barcount > 1) ||
                (fullLayout.bargap === 0 &&
                 fullLayout.bargroupgap === 0 &&
                 !d[0].trace.marker.line.width)) {
            d3.select(this).attr('shape-rendering', 'crispEdges');
        }
    });

    // then style the individual bars
    s.selectAll('g.points').each(function(d) {
        var trace = d[0].trace,
            marker = trace.marker,
            markerLine = marker.line,
            markerScale = Drawing.tryColorscale(marker, ''),
            lineScale = Drawing.tryColorscale(marker, 'line');

        d3.select(this).selectAll('path').each(function(d) {
            // allow all marker and marker line colors to be scaled
            // by given max and min to colorscales
            var fillColor,
                lineColor,
                lineWidth = (d.mlw + 1 || markerLine.width + 1) - 1,
                p = d3.select(this);

            if('mc' in d) fillColor = d.mcc = markerScale(d.mc);
            else if(Array.isArray(marker.color)) fillColor = Color.defaultLine;
            else fillColor = marker.color;

            p.style('stroke-width', lineWidth + 'px')
                .call(Color.fill, fillColor);
            if(lineWidth) {
                if('mlc' in d) lineColor = d.mlcc = lineScale(d.mlc);
                // weird case: array wasn't long enough to apply to every point
                else if(Array.isArray(markerLine.color)) lineColor = Color.defaultLine;
                else lineColor = markerLine.color;

                p.call(Color.stroke, lineColor);
            }
        });
    });
};

function newStuff() {
    s.selectAll('g.points').each(function(d) {
        var sel = d3.select(this);
        var pts = sel.selectAll('.point');
        var txs = sel.selectAll('text');
        var trace = d[0].trace;

        Drawing.pointStyle(pts, trace, gd);
        Drawing.selectedPointStyle(pts, trace);

        txs.each(function(d) {
            var tx = d3.select(this);
            var textFont;

            if(tx.classed('bartext-inside')) {
                textFont = trace.insidetextfont;
            } else if(tx.classed('bartext-outside')) {
                textFont = trace.outsidetextfont;
            }
            if(!textFont) textFont = trace.textfont;

            function cast(k) {
                var cont = textFont[k];
                return Array.isArray(cont) ? cont[d.i] : cont;
            }

            Drawing.font(tx, cast('family'), cast('size'), cast('color'));
        });

        Drawing.selectedTextStyle(txs, trace);
    });

    ErrorBars.style(s);
}
