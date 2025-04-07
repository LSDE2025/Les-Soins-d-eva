// Script pour gérer l'ouverture des blocs
document.querySelectorAll('.bloc').forEach(bloc => {
    bloc.addEventListener('click', () => {
        bloc.classList.toggle('ouvert');
    });
});
