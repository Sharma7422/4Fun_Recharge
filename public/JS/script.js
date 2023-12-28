// Reward button code start

// Function to open the modal and display the image
function openRewardImageModal() {
  document.getElementById('rewardModal').style.display = 'block';
}

// Function to close the modal
function closeRewardImageModal() {
  document.getElementById('rewardModal').style.display = 'none';
}

// Reward button code end

(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()




function noPay() {
  // Get the text field
  var copyText = document.getElementById("payno");


  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices


  navigator.clipboard.writeText(copyText.value);
}

function upiPay() {
  var copyText = document.getElementById("payupi");


  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices


  navigator.clipboard.writeText(copyText.value);
}


