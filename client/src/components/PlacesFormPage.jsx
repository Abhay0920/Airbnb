import { Navigate, useParams} from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import PhotosUploader from "../PhotosUploader";
import Perks from "../Perks";
import AccountNav from "../AccountNav";

export default function PlacesFormPage(){
  const {id} = useParams();

    const [title,setTitle] = useState('');
  const [address,setAddress] = useState('');
  const [addPhotos,setAddPhotos] = useState([]);
  const [description,setDescription] = useState('');
  const [perks,setPerks] = useState([]);
  const [extraInfo,setExtraInfo] = useState('');
  const [checkIn,setCheckIn] = useState('');
  const [checkOut,setCheckOut] = useState('');
  const [maxGuests,setMaxGuest] = useState(1);
  const [price,setPrice] = useState(100);
  const [redirect,setRedirect] = useState(false);
  useEffect(() =>{
     if(!id){
      return;
     }
     axios.get('/places/'+id).then(response =>{
        const {data} = response;
        setTitle(data.title);
        setAddress(data.address);
        setAddPhotos(data.photos);
        setDescription(data.description);
        setPerks(data.perks);
        setExtraInfo(data.extraInfo);
        setCheckIn(data.checkIn);
        setCheckOut(data.checkOut);
        setMaxGuest(data.maxGuests);
        setPrice(data.price);
     })
  },[id]);
  function inputHeader(text){
    return (
        <h2 className="text-2xl mt-4">{text}</h2>
 
    );
  }
  function inputDescription(text){
    return (
        <p className="text-gray-500 text-sm">
         {text}</p>
    );
  }
  function preInput(header,description){
     return(
        <>
        {inputHeader(header)}
        {inputDescription(description)}
        </>
     );
  }

  async function savePlaces(ev) {
    ev.preventDefault();
    const placeData = {
      title, address, addPhotos,
      description, perks, extraInfo,
      checkIn, checkOut, maxGuests, price,
    };
    if (id) {
      // update
      await axios.put('/places', {
        id, ...placeData
      });
      setRedirect(true);
    } else {
      // new place
      await axios.post('/places', placeData);
      setRedirect(true);
    }

  }


  if(redirect){
    return <Navigate to ={'/account/places'} />
  }
    return (
        <div>
            <AccountNav/>
        <form onSubmit={savePlaces}>
          {preInput('Title','Title for your place.should be short and catchy as in advertisment')}
          <input
            type="text"
            value={title} onChange={ev => setTitle(ev.target.value)}
            placeholder="title,for example: my lovely apartment "
          />
          {preInput('Address','Address to this place')}
          <input type="text"
           value={address} onChange={ev => setAddress(ev.target.value)} 
          placeholder="address" />
          {preInput('Photos','more = better')}
          <PhotosUploader addPhotos={addPhotos} onChange={setAddPhotos} />
        
          {preInput('Description','description of the place')}
          <textarea
           value={description} onChange={ev => setDescription(ev.target.value)}
          />
          {preInput('Perks','select all the perks of your place')}
         
          <div className="grid mt-2 gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Perks selected={perks} onChange={setPerks}/>
          </div>
          {preInput('ExtraInfo','house rules, etc')}
         
          <textarea
           value={extraInfo} onChange={ev => setExtraInfo(ev.target.value)}
          />
          {preInput('Check in&out times','add check in and out times, remember to have some time window for cleaning the room between guests')}            
          
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <div className="mt-2 -mb-1">
                  <h3>Check in time</h3>
                  <input type="text" 
                   value={checkIn} onChange={ev => setCheckIn(ev.target.value)}
                  placeholder="14:00" />
              </div>
              <div className="mt-2 -mb-1">
              <h3>Check out time</h3>
                  <input type="text"
                   value={checkOut} onChange={ev => setCheckOut(ev.target.value)}
                  placeholder="11"/>
              </div>
              <div className="mt-2 -mb-1">
              <h3>Max number of guest</h3>
                  <input type="number" 
                   value={maxGuests} onChange={ev => setMaxGuest(ev.target.value)}
                  />
              </div>
              <div className="mt-2 -mb-1">
              <h3>Price per-night</h3>
                  <input type="number" 
                   value={price} onChange={ev => setPrice(ev.target.value)}
                  />
              </div>
          </div>
          <div >
              <button className="primary my-4">Save</button>
          </div>
         
          
        </form>
      </div>
    );
}