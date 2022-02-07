const error = document.querySelector('.error_container');
const cross = document.querySelector('.col--3');
const hideError = () => {
	error.style.display = 'none';
	fetch('/disable-error', {
		method: 'put'
	});
}

if(error){
	fetch('/disable-error', {
		method: 'put'
	});
	setTimeout(() => {
		error.style.display = 'none';
	},5000);	
} 

cross.addEventListener('click', hideError);	
