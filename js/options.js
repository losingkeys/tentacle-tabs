// save the api token when it's entered
document.getElementById('access-token').addEventListener('keyup', function() {
  localStorage.setItem('access-token', this.value);
});
