// frappe.ui.form.on('Sales Order', {
//     custom_penality_rate: function(frm) {
//         // Get the custom_penality_rate value
//         let penalityRate = frm.doc.custom_penality_rate;

//         // Check if there's a valid rate input
//         if (penalityRate) {
//             // Loop through each row in the payment_schedule child table
//             frm.doc.payment_schedule.forEach(row => {
//                 // Calculate custom_penality_amount based on payment_amount
//                 let paymentAmount = row.payment_amount || 0; // Ensure payment_amount is defined
//                 let penaltyAmount = (paymentAmount * penalityRate) / 100; // Calculate penalty amount

//                 // Set the custom_penality_percent and custom_penality_amount in each row
//                 frappe.model.set_value(row.doctype, row.name, 'custom_penality_percent', penalityRate);
//                 frappe.model.set_value(row.doctype, row.name, 'custom_penality_amount', penaltyAmount);
//                 frappe.model.set_value(row.doctype, row.name, 'payment_amount', paymentAmount + penaltyAmount); // Update payment_amount
//             });

//             // Refresh the child table to show updated values
//             frm.refresh_field('payment_schedule');
//         }
//     }
// });
