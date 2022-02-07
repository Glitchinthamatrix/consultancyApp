const data = [20,4,50,120];

const canvas = d3.select('svg').attr('height', 350).attr('width', 1020);

const bars = canvas.selectAll('rect').data(data).enter().append('rect').attr('width', 50).attr('height', function(d) { return d; }).attr('x', function(d,i) { return i * 60 }).attr('y', 150);