# **ShopIt**

## A web app server that doubles as a warehouse/store inventory management and e-commerce platform.

### Proposed Features

1.  Auth Schema
    1.  Signup.
    2.  Login.
    3.  Generate and receive unique code in the registered email.
    4.  Reset Password with the generated code.
    5.  Signup and Login via Google auth. [still in dev.]
2.  User Schema[users are basically divided into two (2)]
    1.  User types
        1.  Company's Staff (roles)
            1.  Business Owner (ADMIN)
            2.  Branch Manager.
            3.  Sales Person (Cashier).
            4.  Store Manager.
            5.  Driver(If any).
        2.  Customers
            1.  Online customer [Those that base their transaction online]
            2.  Walkin customer [Those that come to the physical location of the store]
    2.  Controllers associated with User schema include:
        1.  Update/Edit necessary user info.
        2.  Get all/or one user(s). [staffs are restricted to other staffs or custormers in their location]
        3.  Filter user based on role and branch. [restricted to the ADMIN]
        4.  Change user role. [restricted to the ADMIN and BRANCH MANAGER]
        5.  Remove User from a branch [restricted to the ADMIN]
        6.  Delete Users. [feature restricted to the ADMIN and BRANCH MANAGER]
3.  Branch Schema
    1.  Branch Schema Fields:
        1.  location.
        2.  Branch Manager.
        3.  Store Manager. [If any]
        4.  Sales Person. [or Cashier]
        5.  Product List.
        6.  Invoice List.
        7.  Order List. [for online orders]
        8.  Daily Account.
    2.  Controllers includes
        1.  Create A Branch. [ristricted to the ADMIN alone], upon creation LOCATION must be provided.
        2.  Update Branch info [with restrictions depending on the object to be modified.],
        3.  Add Branch staffs. [restricted to ADMIN and BM]
        4.  Edit Branch Location.
        5.  Get all branch [restricted to ADMIN, branch users can only have see or have access to their branch]
        6.  Delete Branch [restricted to ADMIN]
4.  Product Schema
    1.  Product Schema Fields
        1.  Product Name [should be unique]
        2.  Price.
        3.  Quantity.
        4.  Total Amount. [price * quantity]
        5.  Product Image [if any]
        6.  Product Branch [objectId]
        7.  unit [keg(s), bag(s), ctn(s), pack(s), pc(s), bottle(s)]
    2.  Controllers include
        1.  Create new product. [restricted to ADMIN]
        2.  Update product Info. [restricted to ADMIN]
        3.  Transfer product from one branch to another [retricted to ADMIN]
        4.  Get All Product
        5.  Delete Product
5.  Invoice Schema
    1.  Invoice Schema fields
        1.  Invoice items [{productName, quantity, unitPrice, subTotal}]
        2.  Custmer
        3.  Branch
        4.  Payment status
        5.  Payment method
        6.  Total Amount
        7.  Total Paid
        8.  Sell Due
        9.  Added By
    2.  Controllers include
        1.  New sale
        2.  Edit the sale invoice
        3.  Fetch all sale invoice [only fetches those of user branch]
        4.  Delete Invoice [restriced to only the admins]
