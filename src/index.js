
import module1 from './module1.js'
const isArray = require('isarray')
console.log(module1)
import('./asyncModule1.js').then(module2 => {
  console.log(module2)
})
console.log(isArray([]))
