/*******************************************************************************************
 * Nom du fichier		: swiss-map-pvtarif.js
 * Date				    	: 2015
 * Auteur				    : Mathieu Despont
 * Adresse E-mail		: mathieu at ecodev.ch
 * But de ce fichier: Affiche une carte thématique des tarifs de rachat d'électricité photovoltaique 
 *******************************************************************************************
 * Ce fichier utilise la bibliothèque d3.js
 */

  var width = 960,
      height = 500;

  var color = d3.scale.category20(); // couleur pour une carte qui représente juste les pays mais sans données

  // crée l'élément de base qui va servir d'infobulle au survol
  var tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  var path = d3.geo.path()
      .projection(null); // A cette taille on a pas besoin de projection. Ainsi on évite du calcul inutile.


  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

  // gère le chargement de plusieurs fichiers via une queue.
  // Tout ce qui nécessite ces fichiers ne se lance qu'une fois les fichiers chargés.
  queue()
      .defer(d3.json, "data/ch.json")
      .defer(d3.tsv, "data/municipality-supplier.tsv")
      .await(ready);

  function ready(error, ch, suppliers) {  // les paramètres représentent dans l'ordre les contenus des fichiers dans la queue
    // neighbors = topojson.neighbors(ch.objects.country.geometries);
    neighbors = topojson.neighbors(ch.objects.municipalities.geometries);
    var municipalities = topojson.feature(ch, ch.objects.municipalities).features;  // la GeometryCollection qui contient les communes

    // insère le nom de la commune qui provient du fichier tsv dans les data      
      municipalities.forEach(function(d) { 
        var tryit = suppliers.filter(function(n) { return d.id == n.idofs; })[0];  // filter() fait une sélection avec tous les éléments qui passent le test. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
        if (typeof tryit === "undefined"){
          d.name = "Undefined";
          d.supplier = "Undefined";
           // console.log(d);  // 5 objets ne sont pas présents dans la liste
        } else {
          d.name = tryit.Gemeinde;
          d.supplier = tryit.Name; 
        }
      });

    // crée des éléments SVG pour chaque commune
    svg.selectAll(".municipality")
      .data(municipalities)
      .enter().insert("path", ".graticule")
      .attr("class", "municipality")
      .attr("d", path)
      .attr("id", function(u) {
        return "uid"+u.id;  // ajoute au code svg un id au path qui est l'id ofs (déjà dans les data)
      })
      .style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return municipalities[n].color; }) + 1 | 0); }) // couleur différente des voisins
      .on("mouseover", showTooltip)
      .on("mouseout", hideTooltip);

    // // génére les éléments SVG pour l'objet "country". .datum() = plusieurs SVG
    //     svg.append("path")
    //       .datum(topojson.feature(ch, ch.objects.country))
    //       .attr("class", "country")
    //       .attr("d", path)
    //       .style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); });
    //       
     // génère les éléments SVG pour les frontières (mesh) des communes. Le filtre n'affiche que les frontières intérieures
    svg.append("path")
      .datum(topojson.mesh(ch, ch.objects.municipalities, function(a, b) { return a !== b; }))
      .attr("class", "municipality-boundaries")
      .attr("d", path);

    // génère les éléments SVG pour les frontières (mesh) des cantons. Le filtre n'affiche que les frontières intérieures
    svg.append("path")
      .datum(topojson.mesh(ch, ch.objects.cantons, function(a, b) { return a !== b; }))
      .attr("class", "canton-boundaries")
      .attr("d", path);

  }; // fin ready

   // si la page est dans un iframe, adapte la hauteur du iframe à la hauteur du svg !
  d3.select(self.frameElement).style("height", height + "px");

  /**
  * Affiche l'info-bulle et son contenu.
  *
  * Cette fonction est appelleé au mouseover.
  * @return
  * @param objt d l'élément courant des "data"
  */

  function showTooltip(d) {
    tooltip.transition().duration(300)
    .style("opacity", 1);

    // tooltip.text("pays")
    tooltip.html(d.name+" ("+d.id+") <br />"+d.supplier)
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY -30) + "px");
  }

  /**
  * Masque l'infobulle
  *
  * Cette fonction est appelleé au mouseout.
  * @return
  * @param objt d l'élément courant des "data"
  */
  function hideTooltip(d) {
    tooltip.transition().duration(300)
    .style("opacity", 0);
  }
