const otpField = document.querySelector('input[name="otp"]');
const submit = document.querySelector('.form_container__form__submit');
const timer = document.querySelector('.timer').children[0].children[0];
const resendOTPBtn = document.querySelector('.resend-otp').children[0];

resendOTPBtn.style.color = 'grey';


function getCodeBoxElement(index) {
  return document.getElementById('codeBox' + index);
}
function onKeyUpEvent(index, event) {
  const eventCode = event.which || event.keyCode;
  if (getCodeBoxElement(index).value.length === 1) {
	 if (index !== 4) {
		getCodeBoxElement(index+ 1).focus();
	 } else {
		getCodeBoxElement(index).blur();
		// Submit code
	 }
  }
  if (eventCode === 8 && index !== 1) {
	 getCodeBoxElement(index - 1).focus();
  }
}
function onFocusEvent(index) {
  for (item = 1; item < index; item++) {
	 const currentElement = getCodeBoxElement(item);
	 if (!currentElement.value) {
		  currentElement.focus();
		  break;
	 }
  }
}


let timerCount = parseInt(timer.innerHTML.split(' ')[2]);

const countDown = setInterval(() => {
	if(timerCount === 0) {
		timer.innerHTML = 'Resend';
		resendOTPBtn.style.color = '#0173b2';
		resendOTPBtn.addEventListener('click', (el) => {
			fetch('/resend-otp', {
				method: 'put'
			});
			event.preventDefault();
		});
		clearInterval(countDown);
	} else {
		timerCount--;
		timer.innerHTML = `Resend in ${timerCount}`;	
	}
	
},1000);

function moveOnMax(field, nextField) {
	if(field.value.length >= field.maxLength){
    	document.querySelector(nextField).focus();
  	}
}



