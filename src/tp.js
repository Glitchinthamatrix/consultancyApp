const start = new Date();
start.setHours(11);
start.setMinutes(0);
const end = new Date();
end.setHours(14);
end.setMinutes(0);
slotsWithDate = [];
slots = [];
console.log(start);
console.log(end);
// d.setTimezoneOffset(+530);
// console.log(d.getTimezoneOffset());
function generateSlots(start, end, interval){
	let startTime = start.getTime();
	let endTime = end.getTime();
	let duration = parseInt(interval) * 60 * 1000;
	console.log(start);
	console.log(end);
	console.log(startTime);
	console.log(endTime);
	console.log(duration);
	while(startTime < endTime){
		startTime += duration;
		slotsWithDate.push(new Date(startTime));
		// console.log(slot.toLocaleString().split(', ')[1].split(' ')[0].split(':'));
	}
	// console.log(slotsWithDate);
}	


generateSlots(start, end, '15');

slotsWithDate.forEach(el => {
	slots.push(`${el.toLocaleString().split(', ')[1].split(':')[0]}:${el.toLocaleString().split(', ')[1].split(':')[1]} ${el.toLocaleString().split(', ')[1].split(':')[2].split(' ')[1]}`);
})

console.log(slots);

// const time = new Date(moment('11:00:33', "HH:mm")).getTime();
// console.log(time);