import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <article className="category-card magnetic-card">
      <img src={category.img} alt={category.name} className="category-card-image" />
      <div className="category-card-overlay">
        <span>{category.name}</span>
      </div>
    </article>
  );
};

export default CategoryCard;
