// dummy data
var threeDSecureParameters = {
  amount: "10",
  email: "test@example.com",
  billingAddress: {
    givenName: "Jill", // ASCII-printable characters required, else will throw a validation error
    surname: "Doe", // ASCII-printable characters required, else will throw a validation error
    phoneNumber: "8101234567",
    streetAddress: "555 Smith St.",
    extendedAddress: "#5",
    locality: "Oakland",
    region: "CA",
    postalCode: "12345",
    countryCodeAlpha2: "US",
  },
  additionalInformation: {
    workPhoneNumber: "8101234567",
    shippingGivenName: "Jill",
    shippingSurname: "Doe",
    shippingPhone: "8101234567",
    shippingAddress: {
      streetAddress: "555 Smith St.",
      extendedAddress: "#5",
      locality: "Oakland",
      region: "CA",
      postalCode: "12345",
      countryCodeAlpha2: "US",
    },
  },
};

const getClientToken = async () => {
  const response = await fetch("/client_token");
  const clientToken = await response.json();
  console.log(clientToken);
  return clientToken;
};

const createDropIn = (clientToken) => {
  braintree.dropin.create(
    {
      authorization: clientToken.braintreeclienttoken,
      container: "#dropin-container",
      dataCollector: true,
      applePay: {
        displayName: "Merchant Name",
        paymentRequest: {
          label: "Localized Name",
          total: "10.00",
        },
      },
      googlePay: {
        googlePayVersion: 2,
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: "10",
          currencyCode: "USD",
        },
        shippingAddressRequired: true,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              // We recommend collecting and passing billing address information with all Google Pay transactions as a best practice.
              billingAddressRequired: true,
              billingAddressParameters: {
                format: "FULL",
              },
            },
          },
        ],
      },
      paypal: {
        flow: "vault",
        intent: "authorize",
        amount: "10",
        currency: "USD",
        locale: "en_US",
        enableShippingAddress: true,
        shippingAddressEditable: true,
      },
    },

    function (err, dropinInstance) {
      if (err) {
        // Handle any errors that might've occurred when creating Drop-in
        console.error(err);
        return;
      }
      var paymentOptions = dropinInstance.getAvailablePaymentOptions(); // ['card', 'venmo', 'paypal']
      console.log(paymentOptions);
      var requestPaymentMethodButton = document.querySelector("#submit-button");
      requestPaymentMethodButton.addEventListener("click", function (e) {
        e.preventDefault();
        dropinInstance.requestPaymentMethod(
          {
            threeDSecure: threeDSecureParameters,
          },
          function (err, payload) {
            if (err) {
              console.log(err);
            } else {
              console.log(payload);
              var payButton = document.querySelector("#pay-button");
              payButton.addEventListener("click", function (event) {
                event.preventDefault();
                // Send payload.nonce to your server
                createTransaction(payload);
                payButton.disabled = true;
              });
            }
          }
        );
      });
    }
  );
};

const createTransaction = async (payload, amount) => {
  const formData = {
    nonce: payload.nonce,
    amount: amount,
    deviceData: payload.deviceData,
  };
  console.log(formData);
  const response = await fetch("/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const transactionRespose = await response.json();
  console.log(transactionRespose);
};

(async function () {
  const clientToken = await getClientToken();
  createDropIn(clientToken);
})();
