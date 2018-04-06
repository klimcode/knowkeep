module.exports = function go(flow, errCb) {
  const isFunction = (test) => typeof test === 'function';
  const isArray = (test) => test instanceof Array;
  const lastOf = (array) => array[ array.length-1 ];
  const pushNew = (levels) => levels.push({ functions: [] });


  let steps = [];
  flow.forEach(el => {
    if (isArray(el)) {
      pushNew(steps);
      lastOf(steps).args = el.concat();
    }
    else if (isFunction(el)) {
      lastOf(steps).functions.push(el);
    }
  });

  run(steps, 0);
  function run(steps, stepIndex) { // recursive
    if (stepIndex === steps.length) return;
    const lastStep = stepIndex === steps.length-1 ? true : false;
    const step = steps[stepIndex];

    if (step.prevStepResults) {
      // console.log(step.prevStepResults);
      step.functions.forEach(func => {
        if (!isFunction(func)) return;

        let nextStepArgIndex;
        const nextStepIndex = steps.findIndex(nextStep => {
          nextStepArgIndex = nextStep.args.findIndex(arg => arg === func);
          if (nextStepArgIndex !== -1) return true;
        });
        const arg = step.prevStepResults.length >= 2 ?
          step.prevStepResults :
          step.prevStepResults[0];


        if ((nextStepIndex !== -1) || (nextStepArgIndex !== -1)) {
          steps[nextStepIndex].args[nextStepArgIndex] = new Promise(func.bind(null, arg));
        }
        if (lastStep) {
          func(arg, ()=>{}, ()=>{});
        }
      });

      run(steps, ++stepIndex);
    } else {
      Promise.all(step.args).then(res => {
        step.prevStepResults = res;
        run(steps, stepIndex);
      }).catch(err => errCb && errCb());
    }
  }

  return steps;
}
