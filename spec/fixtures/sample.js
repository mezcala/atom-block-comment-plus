var a = ['foo', 'bar'];

for (var i in a) {
  a[i] += '-cool';
}

/*function dummy() {
    console.log('hi!');
}*/

// console.log(a.join('; '));
console.log(a.join(', '));
