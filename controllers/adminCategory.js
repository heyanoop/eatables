
import { category } from "../models/categoryModel.js";
import Product from "../models/productModel.js";



//=========================================//Category Management==========================================

//loadCategory
export const loadCategory = async (req, res) => {
    try {
      const categoryDetail = await category.find();
      console.log("categorydetail:", categoryDetail);
  
      res.render("category", { categoryDetail });
    } catch (error) {
      console.error(error);
    }
  };
  
  
  //loadEditCategory
  
  export const loadEditCategory = async (req, res) => {
    try {
      const catId = req.query.id;
      const categoryDetail = await category.findById({ _id: catId });
      res.render("editCategory", { categoryDetail });
    } catch (error) {
      console.error(error);
    }
  };
  
  
  //edit Categories
  
  export const EditCategory = async (req, res) => {
    console.log("Edit category endpoint hit");
  
    try {
      const catId = req.query.id;
      console.log("Category ID:", catId);
  
      // Updatin with new data 
      const { categoryDetailName, categoryDetailDescription } = req.body;
      console.log("new name:", categoryDetailName);
      console.log("new des:", categoryDetailDescription);
      const updatedCategory = await category.findByIdAndUpdate(
        catId,
        { name: categoryDetailName, description: categoryDetailDescription },
        { new: true } // returns updated doc
      );
  
      console.log("updated Categoryyyyyy:::", updatedCategory);
  
      if (updatedCategory) {
        console.log("inside updateCat condition");
        res.redirect("/admin/category");
  
      } else {
        res.redirect("/admin/dashboard");
      }
    } catch (error) {
      console.log("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  
  //block categeory
  export const blockCategory = async (req, res) => {
    try {
      const catId = req.query.id;
      console.log("block", catId);
      const catblock = await category.findByIdAndUpdate(catId, {
        isActive: false,
      });
  
      console.log("blocked cat", catblock);
      await Product.updateMany({ category: catId }, { isActive: false });
      // await catData.save()
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  };
  
  //unblock category
  
  export const unblockCategory = async (req, res) => {
    try {
      console.log("Im in controler");
      const catId = req.query.id;
  
      const catUnblock = await category.findByIdAndUpdate(catId, {
        isActive: true,
      });
      await Product.updateMany({ category: catId }, { isActive: true });
      console.log("Im safe");
      // await catData.save()
      res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
    }
  };
  
  //addCategories
  
  export const addCatagories = async (req, res) => {
    try {
      console.log("Iam in addCategories");
      const { categoryName, categoryDescription } = req.body;
      console.log("body", req.body);
  
      const categoryExists = await category.findOne({ name: categoryName });
      const exists = !!categoryExists;
  
      if (exists) {
        console.log("hwello", categoryExists);
        res.status(400).json({ error: "Category already exists" });
        return;
      }
  
      let Category = new category({
        name: categoryName,
        description: categoryDescription,
      });
  
      const newCategory = await Category.save();
      console.log(newCategory);
  
      res.status(201).json(newCategory);
    } catch (error) {
      console.log(error.message);
    }
  };