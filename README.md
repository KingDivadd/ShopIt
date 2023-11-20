# **ShopIt**

## An application for a warehouse/store inventory management and e-commerce platform.

### Proposed Features

1.  Authentication
    1.  Signup.
    2.  Login.
    3.  Generate and receive unique code in the registered email.
    4.  Reset Password with the generated code.
    5.  Signup and Login via Google auth.
2.  User [users are basically divided into two (2)]
    1.  Company's Staff (roles)
        1.  Business Owner
        2.  Branch Manager.
        3.  Sales Person (Cashier).
        4.  Store Manager.
        5.  Driver(If any).
    2.  Customers [for the e-commerce platform]
        Features associated with Users include:
        1.  Update/Edit user info.
        2.  Get all users. [staffs are restricted to users or custormers in their location]
        3.  Change user role. [restricted to the BUSINESS OWNER and BRANCH MANAGER]
        4.  Delete Users. [feature restricted to the BUSINESS ONWER and BRANCH MANAGER]
3.  Branch
    1.  Informations contained:
        1.  location.
        2.  Branch Manager.
        3.  Staff List.
        4.  Store Manager. [If any]
        5.  Sales Person. [or Cashier]
        6.  Product List.
        7.  Invoice List.
        8.  Order List.
    2.  Features included:
        1.  Create A Branch. [ristricted to the BUSINESS OWNER alone], upon creation LOCATION must be provided.
        2.  Update Branch info [with restrictions depending on the object to be modified.],
        3.
