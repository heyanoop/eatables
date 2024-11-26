import Product from "../models/productModel.js";
import {category} from "../models/categoryModel.js"; 





//loading shop page

export const loadShopProduct = async (req, res) => {
  try {
    // Fetch active products
    const products = await Product.find({ isActive: true }).populate('category');

    // Fetch active categories
    const categories = await category.find({ isActive: true });

    // Fetch products with offers, limited to 3
    const productsWithOffers = await Product.find({ offers: { $exists: true, $ne: [] } })
                                            .populate('offers')
                                            .limit(3);

    res.render('shopPage', {
      products: products,
      category: categories,
      offerProduct: productsWithOffers
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};



//sort Products 


export const sortProducts = async (req, res) => {

    console.log(" Im in sort products:::::::::::::::::::::::::::: ")

    try {
      const { sort } = req.query;
      let sortOption = {};
      let query = { isActive: true };
      console.log(query, "query")
  
      if (sort) {
        if (sort === "AtoZ") {

            console.log("A to z")

          sortOption = { title: 1 };
        } else if (sort === "ZtoA") {

            console.log("z to A")

          sortOption = { title: -1 };

          console.log("sort option in z to a", sortOption)
        } else if (sort === "PriceHighToLow") {

            console.log("prizeHigh")

          sortOption = { salesPrice: -1 };
        } else if (sort === "PriceLowToHigh") {

            console.log("pricelow")

          sortOption = { salesPrice: 1 };
        }
      }
  
      const products = await Product.find(query).populate('category').sort(sortOption);

      console.log("Products sorted", products)

      res.json({ products });

    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };


  

 // Search Products 

 export const searchProducts = async (req, res) => {

    console.log("am in search product")

    const productName = req.query.productName;

    console.log("SEarched productname", productName)

    if (!productName) {
        return res.status(400).json({ error: 'Product name parameter is required' });
    }

    try {

     //NOTE: it searches for products where the title, description, or category name contains the search term (case-insensitively). 
     //The result is a list of products that match any of these conditions.

        const regex = new RegExp(productName, 'i'); // 'i' for case insensitive
        const products = await Product.find({
            $and: [
                {
                    $or: [
                        { title: { $regex: regex } },
                        { description: { $regex: regex } }
                    ]
                },
                { isActive: true } 
            ]
        }).populate('category');

        res.json({ products });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



//filtering with price 

export const priceFilter = async (req, res) => {

  console.log("Im in priceFilter::::::")

  try {

      const maxPrice = req.query.price;

      console.log("maxprice query", maxPrice)

      const products = await Product.find({ isActive: true, regularPrice: { $lte: maxPrice } }).populate('category');

      res.json({ products });
      
  } catch (error) {
      console.error('Error fetching filtered products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}


//filter with category


export const categoryFilter = async (req, res) => {

  try {

      const categoryId = req.query.category;

      const products = await Product.find({ category: categoryId, isActive: true }).populate('category');

      res.json({ products });

  } catch (error) {

      console.error('Error fetching filtered products:', error);

      res.status(500).json({ error: 'Internal Server Error' });
  }
}