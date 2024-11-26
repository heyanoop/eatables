




export const loadTrialLogin = async (req, res)=>{
   
    try{

        res.render('login')
    }catch(error){

        console.error("ERROR")
    }

}