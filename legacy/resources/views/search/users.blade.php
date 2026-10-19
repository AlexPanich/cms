<h4>Пользователи</h4>
<ul>
    @foreach($result as $item)
        <li>{{ $item->name }}</li>
    @endforeach
</ul>