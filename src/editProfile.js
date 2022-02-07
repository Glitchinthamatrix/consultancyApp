const gender = document.querySelector('select[name="gender"]');
const country = document.querySelector('select[name="country"]');
const bloodGroup = document.querySelector('select[name="bloodGroup"]');
const timeZone = document.querySelector('select[name="timeZone"]');

function selectOptionFromBackend (optionsList, value){
	for(var i=0; i < optionsList.options.length; i++){
		option = optionsList.options[i];
		if(option.value == value){
			option.selected = 'selected';
		}
	}	
}

selectOptionFromBackend(gender, '<%= session.user.gender %>');
selectOptionFromBackend(country, '<%= session.user.country %>');
selectOptionFromBackend(bloodGroup, '<%= session.user.bloodGroup %>');
selectOptionFromBackend(timeZone, '<%= session.user.timeZone %>');
