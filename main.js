let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return

    observer.disconnect();
    for (let i = 0; i < mutation.addedNodes.length; i++) {
      let node = mutation.addedNodes[i];

      // if node is Create button
      if(node.className == "U26fgb cd29Sd p0oLxb QkA63b CG2qQ aS18D") {
        console.log(node);
        console.log(node.id);

        // on click add iiitd_assignment option as well
        node.addEventListener("click", () => {
          console.log("clicked");
          setTimeout(()=>{
            var quiz_assignment = document.querySelector("#yDmH0d > div.JPdR6b.e5Emjc.hVNH5c.bzD7fd.MEhszc.qjTEB > div > div > span:nth-child(2)");
            quiz_assignment.parentNode.insertBefore(iiitd_assignment_option, quiz_assignment);
          }, 100);
          
        });
      }
    }

    observer.observe(document.body, {
        childList: true
      , subtree: true
      , attributes: true
      , characterData: true
    });


  })
})

observer.observe(document.body, {
    childList: true
  , subtree: true
  , attributes: true
  , characterData: true
})