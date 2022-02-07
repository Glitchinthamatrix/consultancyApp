const cross_sidebar = document.querySelector('.cross-sidebar');
const burger = document.querySelector('.navbar__burger');
const sidebar = document.querySelector('.admin_sidebar');

if(window.matchMedia('(min-width: 1024px)').matches){
	sidebar.style.display = 'flex';
	burger.style.display = 'none';
	cross_sidebar.style.display = 'none';
}

const hideSidebar = () => {
	sidebar.style.display = 'none';
}

const showSidebar = () => {
	sidebar.style.display = 'flex';
}


cross_sidebar.addEventListener('click', hideSidebar);